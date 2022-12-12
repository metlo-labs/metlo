import { QueuedApiTrace } from "@common/types"
import { ApiEndpoint } from "models"
import { getQB } from "services/database/utils"
import { QueryRunner } from "typeorm"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { INTERNAL_IP_SET_KEY, MAX_IPS } from "./constants"

const lastSeenUpdateThresh = 30_000

export const updateIPs = async (
  ctx: MetloContext,
  trace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
  queryRunner: QueryRunner,
) => {
  const traceTime = trace.createdAt.getTime()
  const destinationIP = trace.meta.destination
  const sourceIP = trace.meta.source
  const isSourceInternal = await RedisClient.isSetMember(
    ctx,
    INTERNAL_IP_SET_KEY,
    sourceIP,
  )
  await RedisClient.addValueToSet(ctx, INTERNAL_IP_SET_KEY, [destinationIP])

  let updated = false

  const currHostLastSeen = apiEndpoint.hostIps[destinationIP]
  const currSrcLastSeen = apiEndpoint.srcIps[sourceIP]

  if (
    !currHostLastSeen ||
    traceTime - lastSeenUpdateThresh > currHostLastSeen
  ) {
    apiEndpoint.hostIps[destinationIP] = traceTime
    updated = true
  }
  if (
    isSourceInternal &&
    !apiEndpoint.hostIps[sourceIP] &&
    (!currSrcLastSeen || traceTime - lastSeenUpdateThresh > currSrcLastSeen)
  ) {
    apiEndpoint.srcIps[sourceIP] = traceTime
    updated = true
  }

  if (updated) {
    if (Object.keys(apiEndpoint.hostIps).length > MAX_IPS * 2) {
      apiEndpoint.hostIps = Object.fromEntries(
        Object.entries(apiEndpoint.hostIps)
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_IPS),
      )
    }
    if (Object.keys(apiEndpoint.srcIps).length > MAX_IPS * 2) {
      apiEndpoint.srcIps = Object.fromEntries(
        Object.entries(apiEndpoint.srcIps)
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_IPS),
      )
    }
  }

  if (updated) {
    await getQB(ctx, queryRunner)
      .update(ApiEndpoint)
      .set({
        hostIps: apiEndpoint.hostIps,
        srcIps: apiEndpoint.srcIps,
      })
      .andWhere("uuid = :id", { id: apiEndpoint.uuid })
      .execute()
  }
}
