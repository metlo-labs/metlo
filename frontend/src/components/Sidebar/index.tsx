import {
  Box,
  Divider,
  Flex,
  Spacer,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Logo, SmLogo } from "../Logo";
import { SideNavLinkDestination } from "./NavLinkUtils";
import SideNavLink from "./SideNavLink";

interface SideNavBarProps {
  currentTab?: SideNavLinkDestination;
}

const SideNavBar: React.FC<SideNavBarProps> = React.memo(({ currentTab }) => {
  const bg = useColorModeValue("rgb(248, 248, 249)", "rgb(19, 22, 26)");
  const textColor = useColorModeValue(
    "rgb(102, 105, 117)",
    "rgb(104, 107, 124)"
  );
  const dividerColor = useColorModeValue(
    "rgb(238, 239, 239)",
    "rgb(37, 39, 46)"
  );

  return (
    <Flex
      height="100vh"
      width={{ xl: "300px", base: "100px" }}
      direction="column"
      bg={bg}
      color={textColor}
      px={3}
      py={6}
    >
      <Box
        mb={4}
        display="flex"
        justifyContent={{ xl: "flex-start", base: "center" }}
      >
        <Logo
          width="40%"
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
        <Divider borderColor={dividerColor} my={4} mx={0} />
        <SideNavLink
          destination={SideNavLinkDestination.Connections}
          isActive={currentTab === SideNavLinkDestination.Connections}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Settings}
          isActive={currentTab === SideNavLinkDestination.Settings}
        />
      </Stack>
      <Spacer />
    </Flex>
  );
});

export default SideNavBar;
