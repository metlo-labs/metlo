import React from "react"
import superjson from "superjson"
import ErrorPage from "next/error"
import { AttackDetailResponse } from "@common/types"
import { SidebarLayoutShell } from "components/SidebarLayoutShell"
import { SideNavLinkDestination } from "components/Sidebar/NavLinkUtils"
import { AttackDetailPage } from "enterprise/components/Protection/AttackDetail"

const AttackDetail = ({ attackDetail }) => {
  const parsedAttackDetail = superjson.parse<AttackDetailResponse>(attackDetail)
  const attack = parsedAttackDetail?.attack
  const traces = parsedAttackDetail?.traces
  const validLicense = parsedAttackDetail?.validLicense

  if (!validLicense) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <SidebarLayoutShell
      title="Protection"
      currentTab={SideNavLinkDestination.Protection}
    >
      <AttackDetailPage initialAttack={attack} traces={traces} />
    </SidebarLayoutShell>
  )
}

export default AttackDetail
