import { GetServerSideProps } from "next"
import ErrorPage from "next/error"
import superjson from "superjson"
import { PageWrapper } from "components/PageWrapper"
import TestEditor from "components/TestEditor"
import { ApiEndpointDetailed } from "@common/types"
import { getTest } from "api/tests"
import { getEndpoint } from "api/endpoints"
import { Test } from "@metlo/testing"

const NewTest = ({ endpoint, test }) => {
  const parsedTest = superjson.parse(test) as Test | null
  const parsedEndpoint = superjson.parse(endpoint) as ApiEndpointDetailed | null
  if (!parsedTest || !parsedEndpoint) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <PageWrapper title={parsedTest.name}>
      <TestEditor
        endpoint={parsedEndpoint}
        initTest={parsedTest}
        isNewTest={false}
      />
    </PageWrapper>
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
