import { Heading, VStack } from "@chakra-ui/react"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import ConnectionDocsList from "components/ConnectionDocs"

const Connections = () => {
  return (
    <SidebarLayoutShell
      title="Connections"
      currentTab={SideNavLinkDestination.Connections}
    >
      <ContentContainer>
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="8">
            Connections
          </Heading>
          <ConnectionDocsList />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export default Connections
