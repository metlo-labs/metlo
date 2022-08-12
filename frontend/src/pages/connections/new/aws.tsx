import superjson from "superjson";
import { GetServerSideProps } from "next";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import ConnectionList from "components/ConnectionList";
import { testConnections } from "testData";
import { Connection } from "@common/types";
import { SidebarLayoutShell } from "~/components/SidebarLayoutShell";
import { ContentContainer } from "~/components/utils/ContentContainer";
import { Heading, VStack } from "@chakra-ui/react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { connections: superjson.stringify(testConnections) } };
};

const Connections = ({ connections }) => {
  return "AWS";
};

export default Connections;
