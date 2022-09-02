import { AppDataSource } from "data-source"
import { UsageStats } from "@common/types"
import cache from "memory-cache"

export const getUsageStats = async () => {
  const queryRunner = AppDataSource.createQueryRunner()
  const stats: {
    day: string
    cnt: number
  }[] = await queryRunner.manager.query(`
  SELECT
    DATE_TRUNC('day', traces."createdAt") as day,
    COUNT(*) as cnt
  FROM api_trace traces
  WHERE traces."createdAt" > (NOW() - INTERVAL '15 days')
  GROUP BY 1
  ORDER BY 1
  `)
  const lastNRequests: {
    last1MinCnt: number
    last60MinCnt: number
  } = await queryRunner.manager.query(`
  SELECT
    CAST(SUM(CASE WHEN traces."createdAt" > (NOW() - INTERVAL '1 minutes') THEN 1 ELSE 0 END) AS INTEGER) as "last1MinCnt",
    CAST(COUNT(*) AS INTEGER) as "last60MinCnt"
  FROM api_trace traces
  WHERE traces."createdAt" > (NOW() - INTERVAL '60 minutes')
  `)
  return {
    dailyUsage: stats,
    last1MinCnt: lastNRequests[0].last1MinCnt,
    last60MinCnt: lastNRequests[0].last60MinCnt,
  } as UsageStats
}

export const getUsageStatsCached = async () => {
  const cacheRes: UsageStats | null = cache.get("usageStats")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getUsageStats()
  cache.put("usageStats", realRes, 60000)
  return realRes
}

interface CountsResponse {
  newAlerts: number
  endpointsTracked: number
  piiDataFields: number
  hostCount: number
  highRiskAlerts: number
}

export const getCounts = async () => {
  const queryRunner = AppDataSource.createQueryRunner()
  const newAlertQueryRes = await queryRunner.manager.query(`
    SELECT
      CAST(COUNT(*) AS INTEGER) as count,
      CAST(SUM(CASE WHEN "riskScore" = 'high' THEN 1 ELSE 0 END) AS INTEGER) as high_risk_count
    FROM alert WHERE status = 'Open'
  `)
  const newAlerts = newAlertQueryRes[0].count
  const highRiskAlerts = newAlertQueryRes[0].high_risk_count
  const endpointsTrackedQueryRes = await queryRunner.manager.query(`
    SELECT
      CAST(COUNT(*) AS INTEGER) as endpoint_count,
      CAST(COUNT(DISTINCT(host)) AS INTEGER) as host_count
    FROM api_endpoint
  `)
  const endpointsTracked = endpointsTrackedQueryRes[0].endpoint_count
  const hostCount = endpointsTrackedQueryRes[0].host_count
  const piiDataFieldsQueryRes = await queryRunner.manager.query(`
      SELECT CAST(COUNT(*) AS INTEGER) as count
      FROM data_field WHERE "dataTag" = 'PII'
  `)
  const piiDataFields = piiDataFieldsQueryRes[0].count
  return {
    newAlerts,
    endpointsTracked,
    piiDataFields,
    hostCount,
    highRiskAlerts,
  }
}

export const getCountsCached = async () => {
  const cacheRes: CountsResponse | null = cache.get("usageCounts")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getCounts()
  cache.put("usageCounts", realRes, 5000)
  return realRes
}
