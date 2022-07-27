import { Box, Divider, Flex, Spacer, Stack } from "@chakra-ui/react";
import React from "react";
import { Logo, SmLogo } from "../Logo";
import { SideNavLinkDestination } from "./NavLinkUtils";
import SideNavLink from "./SideNavLink";

interface SideNavBarProps {
  currentTab?: SideNavLinkDestination;
}

const SideNavBar: React.FC<SideNavBarProps> = React.memo(({ currentTab }) => (
  <Flex
    height="100vh"
    width={{ xl: "300px", base: "100px" }}
    direction="column"
    bg="blackAlpha.100"
    px={6}
    py={6}
  >
    <Box
      mb={4}
      display="flex"
      justifyContent={{ xl: "flex-start", base: "center" }}
    >
      <Logo
        width="60%"
        ml="2"
        height="auto"
        display={{ xl: "unset", base: "none" }}
      />
      <SmLogo
        width="30px"
        height="30px"
        display={{ xl: "none", base: "unset" }}
      />
    </Box>
    <Stack spacing={3}>
      <SideNavLink
        destination={SideNavLinkDestination.Overview}
        isActive={currentTab === SideNavLinkDestination.Overview}
      />
      <SideNavLink
        destination={SideNavLinkDestination.Endpoints}
        isActive={currentTab === SideNavLinkDestination.Endpoints}
      />
      <SideNavLink
        destination={SideNavLinkDestination.Tests}
        isActive={currentTab === SideNavLinkDestination.Tests}
      />
      <SideNavLink
        destination={SideNavLinkDestination.Issues}
        isActive={currentTab === SideNavLinkDestination.Issues}
      />
    </Stack>
    <Spacer />
  </Flex>
));

export default SideNavBar;
