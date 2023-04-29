import React from "react"
import Head from "next/head"
import { Box, Stack } from "@chakra-ui/react"
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
  endpoint: SideNavLinkDestination.Endpoints,
  attacks: SideNavLinkDestination.Attacks,
  alerts: SideNavLinkDestination.Alerts,
  endpoints: SideNavLinkDestination.Endpoints,
  tests: SideNavLinkDestination.Tests,
  hosts: SideNavLinkDestination.Hosts,
  "sensitive-data": SideNavLinkDestination.SensitiveData,
  settings: SideNavLinkDestination.Settings,
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
