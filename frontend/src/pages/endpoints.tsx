import { HStack } from "@chakra-ui/react";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import SideNavBar from "../components/Sidebar";
import { SideNavLinkDestination } from "../components/Sidebar/NavLinkUtils";

const Endpoints = () => (
  <HStack spacing={0}>
    <DarkModeSwitch />
    <SideNavBar currentTab={SideNavLinkDestination.Endpoints}/>
  </HStack>
);

export default Endpoints;
