import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"

const SensitiveData = () => {
  return (
    <SidebarLayoutShell
      title="Sensitive Data"
      currentTab={SideNavLinkDestination.SensitiveData}
    ></SidebarLayoutShell>
  )
}

export default SensitiveData
