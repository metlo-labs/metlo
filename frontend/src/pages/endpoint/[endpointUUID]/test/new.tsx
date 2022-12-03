import { GetServerSideProps } from "next"
import ErrorPage from "next/error"
import superjson from "superjson"
import { PageWrapper } from "components/PageWrapper"
import TestEditor from "components/TestEditor"
import { getEndpoint } from "api/endpoints"
import { ApiEndpointDetailed } from "@common/types"
import { makeNewRequest } from "components/TestEditor/requestUtils"
import { v4 as uuidv4 } from "uuid"

const NewTest = ({ endpoint }) => {
  const parsedEndpoint = superjson.parse(endpoint) as ApiEndpointDetailed | null
  if (!parsedEndpoint) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <PageWrapper title="New Test">
      <TestEditor
        endpoint={parsedEndpoint}
        initTest={{
          uuid: uuidv4(),
          name: "Untitled Test",
          tags: [],
          requests: [makeNewRequest(parsedEndpoint)],
        }}
        isNewTest={true}
      />
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const endpoint = await getEndpoint(context.query.endpointUUID as string)
  return {
    props: {
      endpoint: superjson.stringify(endpoint),
    },
  }
}

export default NewTest
