import { GetServerSideProps } from "next"
import Error from "next/error"
import superjson from "superjson"
import SensitiveDataPage from "components/SensitiveData"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { getSensitiveDataSummary } from "api/sensitiveData"
import { SensitiveDataSummary } from "@common/types"
import { getHosts } from "api/endpoints"

const SensitiveData = ({ summary, hosts }) => {
  const parsedSummary = superjson.parse<SensitiveDataSummary>(summary)
  if (!parsedSummary) {
    return <Error statusCode={500} />
  }
  return (
    <SidebarLayoutShell
      title="Sensitive Data"
      currentTab={SideNavLinkDestination.SensitiveData}
    >
      <SensitiveDataPage initSummary={parsedSummary} hosts={hosts} />
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const summaryPromise = getSensitiveDataSummary({})
  const hostsPromise = getHosts()
  const [hosts, summary] = await Promise.all([hostsPromise, summaryPromise])
  return {
    props: {
      hosts,
      summary: superjson.stringify(summary),
    },
  }
}

export default SensitiveData
