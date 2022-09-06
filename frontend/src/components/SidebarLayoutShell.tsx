import React from "react"
import Head from "next/head"
import { Box, HStack } from "@chakra-ui/react"
import SideNavBar from "./Sidebar"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"

interface SidebarLayoutShellProps {
  title?: string
  currentTab?: SideNavLinkDestination
  children?: React.ReactNode
}

export const SidebarLayoutShell: React.FC<SidebarLayoutShellProps> = React.memo(
  ({ title, currentTab, children }) => {
    return (
      <HStack spacing="0" w="100vw">
        {title ? (
          <Head>
            <title>{title}</title>
          </Head>
        ) : null}
        <SideNavBar currentTab={currentTab} />
        <Box h="100vh" flex="1" overflowY="auto">
          {children}
        </Box>
      </HStack>
    )
  },
)
