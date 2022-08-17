import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "~/components/SidebarLayoutShell";
import { ContentContainer } from "~/components/utils/ContentContainer";
import { Flex, Heading, VStack } from "@chakra-ui/react";
import { useState } from "react";
import ConfigureAWS from "~/components/ConnectionConfiguration/AWS/configureAws";

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
