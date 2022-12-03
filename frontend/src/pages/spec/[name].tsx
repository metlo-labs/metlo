import { GetServerSideProps } from "next"
import ErrorPage from "next/error"
import superjson from "superjson"
import { PageWrapper } from "components/PageWrapper"
import { getSpec } from "api/apiSpecs"
import SpecPage from "components/Spec"
import { OpenApiSpec } from "@common/types"
import { ContentContainer } from "components/utils/ContentContainer"

const Spec = ({ spec }) => {
  const parsedSpec = superjson.parse(spec) as OpenApiSpec | null
  if (!parsedSpec) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <PageWrapper>
      <ContentContainer maxContentW="5xl" height="full">
        <SpecPage spec={parsedSpec} />
      </ContentContainer>
    </PageWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  const spec = await getSpec(encodeURIComponent(context.query.name as string))
  return { props: { spec: superjson.stringify(spec) } }
}

export default Spec
