import { Heading, VStack } from "@chakra-ui/react";
import { testAlerts } from "testData";
import HomePage from "../components/Home";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "../components/SidebarLayoutShell";
import { ContentContainer } from "../components/utils/ContentContainer";

const Index = () => (
  <SidebarLayoutShell currentTab={SideNavLinkDestination.Home}>
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          Home
        </Heading>
        <HomePage
          numAlerts={10}
          numEndpoints={84}
          numPIIDataDetected={20}
          alerts={testAlerts}
        />
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);

export default Index;
