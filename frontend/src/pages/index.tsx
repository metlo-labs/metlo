import { HStack } from "@chakra-ui/react";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import SideNavBar from "../components/Sidebar";

const Index = () => (
  <HStack spacing={0}>
    <DarkModeSwitch />
    <SideNavBar />
  </HStack>
);

export default Index;
