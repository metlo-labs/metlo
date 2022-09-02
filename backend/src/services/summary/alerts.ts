import { Status, AlertType } from "@common/enums"
import { AppDataSource } from "data-source"
import { Alert } from "models"
import cache from "memory-cache"

export const getAlertTypeAgg = async () => {
  const queryRunner = AppDataSource.createQueryRunner()
  const alertTypeAggRes: { type: AlertType; count: number }[] =
    await queryRunner.manager.query(`
    SELECT type, CAST(COUNT(*) AS INTEGER) as count
    FROM alert WHERE status = 'Open'
    GROUP BY 1
  `)
  return Object.fromEntries(alertTypeAggRes.map(e => [e.type, e.count]))
}

export const getAlertTypeAggCached = async () => {
  const cacheRes: Record<AlertType, number> | null = cache.get("alertTypeAgg")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getAlertTypeAgg()
  cache.put("alertTypeAgg", realRes, 5000)
  return realRes
}

export const getTopAlerts = async () => {
  const alertRepository = AppDataSource.getRepository(Alert)
  return await alertRepository.find({
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

export const getTopAlertsCached = async () => {
  const cacheRes: Alert[] | null = cache.get("topAlertsCached")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getTopAlerts()
  cache.put("topAlertsCached", realRes, 5000)
  return realRes
}
