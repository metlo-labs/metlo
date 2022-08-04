import superjson from "superjson";
import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";
import ConnectionList from "components/ConnectionList";
import { GetServerSideProps } from "next";
import { testConnections } from "testData";
import { Connection } from "@common/types";

const Connections = ({ connections }) => (
  <SidebarLayoutShell currentTab={SideNavLinkDestination.Connections}>
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          Connections
        </Heading>
        <ConnectionList
          connections={superjson.parse<Connection[]>(connections)}
        />
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { connections: superjson.stringify(testConnections) } };
};

export default Connections;
