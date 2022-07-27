import { HStack } from "@chakra-ui/react";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import SideNavBar from "../components/Sidebar";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";

const Tests = () => (
  <HStack spacing={0}>
    <DarkModeSwitch />
    <SideNavBar currentTab={SideNavLinkDestination.Tests} />
  </HStack>
);

export default Tests;
