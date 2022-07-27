import { HStack } from "@chakra-ui/react";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import SideNavBar from "../components/Sidebar";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";

const Settings = () => (
  <HStack spacing={0}>
    <DarkModeSwitch />
    <SideNavBar currentTab={SideNavLinkDestination.Settings} />
  </HStack>
);

export default Settings;
