import superjson from "superjson";
import { GetServerSideProps } from "next";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { testConnections } from "testData";
import { SidebarLayoutShell } from "~/components/SidebarLayoutShell";
import { ContentContainer } from "~/components/utils/ContentContainer";
import {
  Flex,
  Heading,
  NumberInput,
  NumberInputField,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import ConfigureAWS from "~/components/ConnectionConfiguration/AWS/configureAws";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { connections: superjson.stringify(testConnections) } };
};

const Connections = ({}) => {
  const [selectedIndex, updateIndex] = useState(1);
  return (
    <SidebarLayoutShell currentTab={SideNavLinkDestination.Connections}>
      <ContentContainer height="full">
        <VStack w="full" alignItems="flex-start" h={"full"}>
          <Heading fontWeight="medium" size="xl" mb="8">
            Configure Metlo connection for AWS
          </Heading>
          <Flex w={"full"} h={"full"} direction="column">
            <ConfigureAWS
              selected={selectedIndex}
              updateSelected={updateIndex}
            />
          </Flex>
        </VStack>
      </ContentContainer>
    </SidebarLayoutShell>
  );
};

export default Connections;
