import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"

const Vulnerabilities = () => {
  return (
    <SidebarLayoutShell
      title="Vulnerabilities"
      currentTab={SideNavLinkDestination.Vulnerabilities}
    ></SidebarLayoutShell>
  )
}

export default Vulnerabilities
