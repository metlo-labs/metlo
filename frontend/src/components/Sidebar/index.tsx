import {
  Box,
  BoxProps,
  CloseButton,
  Divider,
  Drawer,
  DrawerContent,
  Flex,
  HStack,
  IconButton,
  Spacer,
  Stack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import React from "react"
import { Logo, SmLogo } from "components/Logo"
import { SideNavLinkDestination } from "./NavLinkUtils"
import SideNavLink from "./SideNavLink"
import { FiMenu } from "icons/fi/FiMenu"
import Link from "next/link"

interface SideNavBarProps {
  currentTab?: SideNavLinkDestination
}

interface SidebarProps extends BoxProps {
  onClose: () => void
  isOpen: boolean
  currentTab?: SideNavLinkDestination
}

const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <HStack
      p={4}
      alignItems="center"
      justifyContent="space-between"
      {...rest}
      w="full"
      h="74px"
      minH="74px"
      maxH="74px"
    >
      <Link href="/">
        <Logo ml="2" />
      </Link>
      <IconButton onClick={onOpen} aria-label="open menu" icon={<FiMenu />} />
    </HStack>
  )
}

const SidebarContent = ({
  isOpen,
  currentTab,
  onClose,
  ...rest
}: SidebarProps) => {
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
      height="full"
      overflowY="auto"
      width={{ base: "full", md: "64" }}
      direction="column"
      bg="secondaryBG"
      color={textColor}
      px={3}
      py={6}
      {...rest}
    >
      <HStack mb="6" w="full" justifyContent="space-between">
        <Logo ml="2" />
        <CloseButton display={isOpen ? "flex" : "none"} onClick={onClose} />
      </HStack>
      <Stack spacing={3}>
        <SideNavLink
          destination={SideNavLinkDestination.Home}
          isActive={currentTab === SideNavLinkDestination.Home}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Endpoints}
          isActive={currentTab === SideNavLinkDestination.Endpoints}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Hosts}
          isActive={currentTab === SideNavLinkDestination.Hosts}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.SensitiveData}
          isActive={currentTab === SideNavLinkDestination.SensitiveData}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Attacks}
          isActive={currentTab === SideNavLinkDestination.Attacks}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Tests}
          isActive={currentTab === SideNavLinkDestination.Tests}
          onClose={onClose}
        />
        <SideNavLink
          destination={SideNavLinkDestination.Alerts}
          isActive={currentTab === SideNavLinkDestination.Alerts}
          onClose={onClose}
        />
        <Divider borderColor={dividerColor} my={4} mx={0} />
        <SideNavLink
          destination={SideNavLinkDestination.Settings}
          isActive={currentTab === SideNavLinkDestination.Settings}
          onClose={onClose}
        />
      </Stack>
      <Spacer />
    </Flex>
  )
}

const SideNavBar: React.FC<SideNavBarProps> = React.memo(({ currentTab }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box h={{ base: "74px", md: "100vh" }}>
      <SidebarContent
        display={{ base: "none", md: "block" }}
        onClose={() => onClose}
        currentTab={currentTab}
        isOpen={isOpen}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent
            onClose={onClose}
            currentTab={currentTab}
            isOpen={isOpen}
          />
        </DrawerContent>
      </Drawer>
      <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
    </Box>
  )
})

export default SideNavBar
