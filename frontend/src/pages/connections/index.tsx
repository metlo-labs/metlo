import superjson from "superjson"
import { Heading, VStack } from "@chakra-ui/react"
import { GetServerSideProps } from "next"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import ConnectionList from "components/ConnectionList"
import { ConnectionInfo } from "@common/types"
import axios from "axios"
import { getAPIURL } from "~/constants"
import { useState } from "react"
import ConnectionDocsList from "components/ConnectionDocs"

const Connections = ({ connections: _connections }) => {
  const [connections, setConnections] = useState(
    superjson.parse<ConnectionInfo[]>(_connections),
  )

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
          {/* <ConnectionList
            connections={connections}
            setConnections={setConnections}
          /> */}
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  )
}

export const getServerSideProps: GetServerSideProps = async context => {
  let resp = await axios.get<Array<ConnectionInfo>>(
    `${getAPIURL()}/list_connections`,
  )
  return {
    props: {
      connections: superjson.stringify(
        resp.data.map(v => {
          v.createdAt = new Date(v.createdAt)
          v.updatedAt = new Date(v.updatedAt)
          return v
        }),
      ),
    },
  }
}

export default Connections
