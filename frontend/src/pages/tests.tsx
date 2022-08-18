import { Heading, VStack } from "@chakra-ui/react";
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils";
import { SidebarLayoutShell } from "~/components/SidebarLayoutShell";
import { ContentContainer } from "~/components/utils/ContentContainer";

const Tests = () => (
  <SidebarLayoutShell
    title="Tests"
    currentTab={SideNavLinkDestination.Tests}
  >
    <ContentContainer>
      <VStack w="full" alignItems="flex-start">
        <Heading fontWeight="medium" size="xl" mb="8">
          Tests
        </Heading>
      </VStack>
    </ContentContainer>
  </SidebarLayoutShell>
);

export default Tests;
