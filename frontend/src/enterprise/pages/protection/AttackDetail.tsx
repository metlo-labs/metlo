import React from "react"
import superjson from "superjson"
import ErrorPage from "next/error"
import { AttackDetailResponse } from "@common/types"
import { PageWrapper } from "components/PageWrapper"
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
    <PageWrapper title="Protection">
      <AttackDetailPage initialAttack={attack} traces={traces} />
    </PageWrapper>
  )
}

export default AttackDetail
