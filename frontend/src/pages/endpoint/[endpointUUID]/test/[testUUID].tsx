import { GetServerSideProps } from "next"
import ErrorPage from "next/error"
import superjson from "superjson"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import TestEditor from "components/TestEditor"
import { ApiEndpointDetailed } from "@common/types"
import { getTest } from "api/tests"
import { getEndpoint } from "api/endpoints"
import { Test } from "@common/testing/types"

const NewTest = ({ endpoint, test }) => {
  const parsedTest = superjson.parse(test) as Test | null
  const parsedEndpoint = superjson.parse(endpoint) as ApiEndpointDetailed | null
  if (!parsedTest || !parsedEndpoint) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <SidebarLayoutShell
      title={parsedTest.name}
      currentTab={SideNavLinkDestination.Endpoints}
    >
      <TestEditor endpoint={parsedEndpoint} initTest={parsedTest} />
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const test = await getTest(context.query.testUUID as string)
  const endpoint = await getEndpoint(context.query.endpointUUID as string)
  return {
    props: {
      test: superjson.stringify(test.data),
      endpoint: superjson.stringify(endpoint),
    },
  }
}

export default NewTest
