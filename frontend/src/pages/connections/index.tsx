import { Heading, Text, VStack, Link } from "@chakra-ui/react"
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
      <ContentContainer  maxContentW="100rem" px="8" py="8">
        <VStack w="full" alignItems="flex-start">
          <Heading fontWeight="medium" size="xl" mb="2">
            Connections
          </Heading>
          <Text fontWeight="medium" pb="6">
            Set up a Connection to send API traffic to Metlo. You can generate
            an API Key on the <Link href="/settings">settings page.</Link>
          </Text>
          <ConnectionDocsList />
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export default Connections
