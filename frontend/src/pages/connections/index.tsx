import superjson from "superjson";
import { Heading, VStack } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";
import ConnectionList from "components/ConnectionList";
import { ListConnections } from "@common/types";
import axios from "axios";
import { getAPIURL } from "~/constants";

const Connections = ({ connections }) => (
  <SidebarLayoutShell
    title="Connections"
    currentTab={SideNavLinkDestination.Connections}
  >
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          Connections
        </Heading>
        <ConnectionList
          connections={superjson.parse<ListConnections[]>(connections)}
        />
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  let resp = await axios.get<Array<ListConnections>>(
    `${getAPIURL()}/list_connections`
  );
  return {
    props: {
      connections: superjson.stringify(
        resp.data.map((v) => {
          v.createdAt = new Date(v.createdAt);
          v.updatedAt = new Date(v.updatedAt);
          return v;
        })
      ),
    },
  };
};

export default Connections;
