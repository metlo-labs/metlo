import { HStack } from "@chakra-ui/react";
import { DarkModeSwitch } from "../components/utils/DarkModeSwitch";
import SideNavBar from "../components/Sidebar";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";

const Connections = () => (
  <HStack spacing={0}>
    <DarkModeSwitch />
    <SideNavBar currentTab={SideNavLinkDestination.Connections} />
  </HStack>
);

export default Connections;
