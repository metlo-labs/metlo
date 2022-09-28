import superjson from "superjson"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { ContentContainer } from "components/utils/ContentContainer"
import { ProtectionEmptyView } from "enterprise/components/Protection/ProtectionEmptyView"
import { ProtectionPage } from "enterprise/components/Protection"
import { AttackResponse } from "@common/types"

const Protection = ({ attacksResponse, hosts }) => {
  const parsedAttacks = superjson.parse<AttackResponse>(attacksResponse)
  const parsedHosts = superjson.parse<string[]>(hosts)
  let page = (
    <ProtectionPage initAttackResponse={parsedAttacks} hosts={parsedHosts} />
  )
  if (!parsedAttacks?.validLicense) {
    page = (
      <ContentContainer maxContentW="full" px="0" py="0">
        <ProtectionEmptyView />
      </ContentContainer>
    )
  }
  return (
    <SidebarLayoutShell
      title="Protection"
      currentTab={SideNavLinkDestination.Protection}
    >
      {page}
    </SidebarLayoutShell>
  )
}

export default Protection
