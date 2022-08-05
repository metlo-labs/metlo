import React from "react";
import { Box, HStack } from "@chakra-ui/react";
import SideNavBar from "./Sidebar";
import { SideNavLinkDestination } from "./Sidebar/NavLinkUtils";
import { DarkModeSwitch } from "./utils/DarkModeSwitch";

interface SidebarLayoutShellProps {
  currentTab?: SideNavLinkDestination;
  children?: React.ReactNode;
}

export const SidebarLayoutShell: React.FC<SidebarLayoutShellProps> = React.memo(
  ({ currentTab, children }) => {
    return (
      <HStack spacing={0}>
        <SideNavBar currentTab={currentTab} />
        <Box h="100vh" flex="1" overflowY="scroll">
          {children}
          <DarkModeSwitch />
        </Box>
      </HStack>
    );
  }
);
