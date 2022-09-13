import { UsageStats } from "@common/types"
import cache from "memory-cache"
import { DatabaseService } from "services/database"

export const getUsageStats = async () => {
  const statsQuery = `
    SELECT
      DATE_TRUNC('day', traces."createdAt") as day,
      SUM(traces."numCalls") as cnt
    FROM aggregate_trace_data traces
    WHERE traces."createdAt" > (NOW() - INTERVAL '15 days')
    GROUP BY 1
    ORDER BY 1
  `
  const lastNRequestsQuery = `
    SELECT
      CAST(SUM(CASE WHEN traces."createdAt" > (NOW() - INTERVAL '1 minutes') THEN 1 ELSE 0 END) AS INTEGER) as "last1MinCnt",
      CAST(COUNT(*) AS INTEGER) as "last60MinCnt"
    FROM api_trace traces
    WHERE traces."createdAt" > (NOW() - INTERVAL '60 minutes')
  `
  const queryResponses = await DatabaseService.executeRawQueries([
    statsQuery,
    lastNRequestsQuery,
  ])
  const stats: {
    day: string
    cnt: number
  }[] = queryResponses[0]
  const lastNRequests: {
    last1MinCnt: number
    last60MinCnt: number
  } = queryResponses[1]
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
  const newAlertQuery = `
    SELECT
      CAST(COUNT(*) AS INTEGER) as count,
      CAST(SUM(CASE WHEN "riskScore" = 'high' THEN 1 ELSE 0 END) AS INTEGER) as high_risk_count
    FROM alert WHERE status = 'Open'
  `
  const endpointsTrackedQuery = `
    SELECT
      CAST(COUNT(*) AS INTEGER) as endpoint_count,
      CAST(COUNT(DISTINCT(host)) AS INTEGER) as host_count
    FROM api_endpoint
  `
  const piiDataFieldsQuery = `
    SELECT CAST(COUNT(*) AS INTEGER) as count
    FROM data_field WHERE "dataTag" = 'PII'
  `
  const [newAlertQueryRes, endpointsTrackedQueryRes, piiDataFieldsQueryRes] =
    await DatabaseService.executeRawQueries([
      newAlertQuery,
      endpointsTrackedQuery,
      piiDataFieldsQuery,
    ])
  const newAlerts = newAlertQueryRes[0].count ?? 0
  const highRiskAlerts = newAlertQueryRes[0].high_risk_count ?? 0
  const endpointsTracked = endpointsTrackedQueryRes[0].endpoint_count ?? 0
  const hostCount = endpointsTrackedQueryRes[0].host_count ?? 0
  const piiDataFields = piiDataFieldsQueryRes[0].count ?? 0
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
