import { GetServerSideProps } from "next"
import ErrorPage from "next/error"
import superjson from "superjson"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import EndpointPage from "components/Endpoint"
import { getEndpoint, getUsage } from "api/endpoints"
import { ApiEndpointDetailed, Usage, Alert } from "@common/types"
import { getAlerts } from "api/alerts"
import { Status } from "@common/enums"

const Endpoint = ({ endpoint, usage, alerts, initAlertParams }) => {
  const parsedEndpoint = superjson.parse(endpoint) as ApiEndpointDetailed | null
  const parsedUsage = superjson.parse(usage) as Usage[] | []
  const parsedAlerts = superjson.parse(alerts) as Alert[] | []
  if (!parsedEndpoint) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <SidebarLayoutShell
      title="Endpoint"
      currentTab={SideNavLinkDestination.Endpoints}
    >
      <EndpointPage
        endpoint={parsedEndpoint}
        usage={parsedUsage}
        alerts={parsedAlerts}
        initAlertParams={initAlertParams}
      />
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const initAlertParams = {
    apiEndpointUuid: context.query.endpointUUID as string,
    riskScores: [],
    status: [Status.OPEN],
    alertTypes: [],
    order: "DESC" as const,
  }
  const endpointPromise = getEndpoint(context.query.endpointUUID as string)
  const usagePromise = getUsage(context.query.endpointUUID as string)
  const alertPromise = getAlerts(initAlertParams)
  const promises = [endpointPromise, usagePromise, alertPromise]
  let [endpoint, usage, alerts] = await Promise.all(promises)
  return {
    props: {
      endpoint: superjson.stringify(endpoint),
      usage: superjson.stringify(usage),
      alerts: superjson.stringify(alerts[0]),
      initAlertParams,
    },
  }
}

export default Endpoint
