import {
  Box,
  Divider,
  Flex,
  Spacer,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react"
import React from "react"
import { Logo, SmLogo } from "components/Logo"
import { SideNavLinkDestination } from "./NavLinkUtils"
import SideNavLink from "./SideNavLink"

interface SideNavBarProps {
  currentTab?: SideNavLinkDestination
}

const SideNavBar: React.FC<SideNavBarProps> = React.memo(({ currentTab }) => {
  const textColor = useColorModeValue(
    "rgb(102, 105, 117)",
    "rgb(104, 107, 124)",
  )
  const dividerColor = useColorModeValue(
    "rgb(238, 239, 239)",
    "rgb(37, 39, 46)",
  )

  return (
    <Flex
      height="100vh"
      width={{ xl: "250px", base: "100px" }}
      direction="column"
      bg="secondaryBG"
      color={textColor}
      px={3}
      py={6}
    >
      <Box
        mb="6"
        display="flex"
        justifyContent={{ xl: "flex-start", base: "center" }}
      >
        <Logo ml="2" display={{ xl: "unset", base: "none" }} />
        <SmLogo display={{ xl: "none", base: "unset" }} />
      </Box>
      <Stack spacing={3}>
        <SideNavLink
          destination={SideNavLinkDestination.Home}
          isActive={currentTab === SideNavLinkDestination.Home}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Endpoints}
          isActive={currentTab === SideNavLinkDestination.Endpoints}
        />
        <SideNavLink
          destination={SideNavLinkDestination.SensitiveData}
          isActive={currentTab === SideNavLinkDestination.SensitiveData}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Vulnerabilities}
          isActive={currentTab === SideNavLinkDestination.Vulnerabilities}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Protection}
          isActive={currentTab === SideNavLinkDestination.Protection}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Alerts}
          isActive={currentTab === SideNavLinkDestination.Alerts}
        />
        <Divider borderColor={dividerColor} my={4} mx={0} />
        <SideNavLink
          destination={SideNavLinkDestination.Connections}
          isActive={currentTab === SideNavLinkDestination.Connections}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Specs}
          isActive={currentTab === SideNavLinkDestination.Specs}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Keys}
          isActive={currentTab === SideNavLinkDestination.Keys}
        />
      </Stack>
      <Spacer />
    </Flex>
  )
})

export default SideNavBar
