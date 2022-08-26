import superjson from "superjson"
import { GetServerSideProps } from "next"
import { Heading, VStack } from "@chakra-ui/react"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import SpecList from "components/SpecList"
import { OpenApiSpec } from "@common/types"
import { getSpecs } from "api/apiSpecs"

const Specs = ({ apiSpecs }) => (
  <SidebarLayoutShell
    title="API Specs"
    currentTab={SideNavLinkDestination.Specs}
  >
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          API Specs
        </Heading>
        <SpecList apiSpecs={superjson.parse<OpenApiSpec[]>(apiSpecs)} />
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
)

export const getServerSideProps: GetServerSideProps = async context => {
  const apiSpecs = await getSpecs()
  return { props: { apiSpecs: superjson.stringify(apiSpecs) } }
}

export default Specs
