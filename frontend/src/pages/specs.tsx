import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "components/SidebarLayoutShell";
import { ContentContainer } from "components/utils/ContentContainer";

const Specs = () => (
  <SidebarLayoutShell currentTab={SideNavLinkDestination.Specs}>
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          API Specs
        </Heading>
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);

export default Specs;
