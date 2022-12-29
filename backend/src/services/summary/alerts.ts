import { Status, AlertType } from "@common/enums"
import { Alert } from "models"
import { DatabaseService } from "services/database"
import { getRepository } from "services/database/utils"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"

export const getAlertTypeAgg = async (ctx: MetloContext) => {
  const alertTypeAggRes: { type: AlertType; count: number }[] =
    await DatabaseService.executeRawQuery(`
      SELECT type, CAST(COUNT(*) AS INTEGER) as count
      FROM ${Alert.getTableName(ctx)} alert WHERE status = 'Open'
      GROUP BY 1
    `)
  return Object.fromEntries(alertTypeAggRes.map(e => [e.type, e.count]))
}

export const getAlertTypeAggCached = async (ctx: MetloContext) => {
  const cacheRes: Record<AlertType, number> | null =
    await RedisClient.getFromRedis(ctx, "alertTypeAgg")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getAlertTypeAgg(ctx)
  await RedisClient.addToRedis(ctx, "alertTypeAgg", realRes, 5)
  return realRes
}

export const getTopAlerts = async (ctx: MetloContext) => {
  const alertRepository = getRepository(ctx, Alert)
  return await alertRepository.find({
    select: {
      uuid: true,
      type: true,
      riskScore: true,
      createdAt: true,
      apiEndpointUuid: true,
      apiEndpoint: {
        host: true,
        path: true,
        method: true,
      }
    },
    where: {
      status: Status.OPEN,
    },
    relations: {
      apiEndpoint: true,
    },
    order: {
      riskScore: "DESC",
      createdAt: "DESC",
    },
    take: 10,
  })
}

export const getTopAlertsCached = async (ctx: MetloContext) => {
  const cacheRes: Alert[] | null = await RedisClient.getFromRedis(
    ctx,
    "topAlertsCached",
  )
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getTopAlerts(ctx)
  await RedisClient.addToRedis(ctx, "topAlertsCached", realRes, 5)
  return realRes
}
