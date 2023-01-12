import React from "react"
import Head from "next/head"
import { Box, HStack, Stack } from "@chakra-ui/react"
import SideNavBar from "./Sidebar"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { useRouter } from "next/router"

interface SidebarLayoutShellProps {
  title?: string
  currentTab?: SideNavLinkDestination
  children?: React.ReactNode
}

const itemToNavLink = {
  "": SideNavLinkDestination.Home,
  connections: SideNavLinkDestination.Connections,
  endpoint: SideNavLinkDestination.Endpoints,
  protection: SideNavLinkDestination.Protection,
  spec: SideNavLinkDestination.Specs,
  alerts: SideNavLinkDestination.Alerts,
  endpoints: SideNavLinkDestination.Endpoints,
  hosts: SideNavLinkDestination.Hosts,
  "sensitive-data": SideNavLinkDestination.SensitiveData,
  settings: SideNavLinkDestination.Settings,
  specs: SideNavLinkDestination.Specs,
  vulnerabilities: SideNavLinkDestination.Vulnerabilities,
}

export const SidebarLayoutShell: React.FC<SidebarLayoutShellProps> = React.memo(
  ({ title, currentTab, children }) => {
    const router = useRouter()
    const path = router.pathname
    if (!currentTab) {
      const firstItem = path.split("/")[1]
      currentTab = itemToNavLink[firstItem]
    }
    return (
      <Stack h="100vh" direction={{ base: "column", md: "row" }} spacing="0">
        {title ? (
          <Head>
            <title>{title}</title>
          </Head>
        ) : null}
        <SideNavBar currentTab={currentTab} />
        <Box h="full" flex="1" overflowY="auto">
          {children}
        </Box>
      </Stack>
    )
  },
)
