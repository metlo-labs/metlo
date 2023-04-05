import { UsageStats } from "@common/types"
import mlog from "logger"
import { AggregateTraceDataHourly, Alert, ApiEndpoint, DataField } from "models"
import { DatabaseService } from "services/database"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { ORG_ENDPOINT_CALL_COUNT, USAGE_GRANULARITY } from "~/constants"

const getLastMinCounts = async (ctx: MetloContext) => {
  const time = new Date().getTime()
  // Subtract USAGE_GRANULARITY again to get previous slot
  const timePrevSlot = time - (time % USAGE_GRANULARITY) - USAGE_GRANULARITY
  let key = `${ORG_ENDPOINT_CALL_COUNT}_${timePrevSlot}`
  let stat = await RedisClient.getFromRedisUsage(ctx, key)
  if (stat === null) {
    const timeCurrSlot = time - (time % USAGE_GRANULARITY)
    key = `${ORG_ENDPOINT_CALL_COUNT}_${timeCurrSlot}`
    stat = await RedisClient.getFromRedisUsage(ctx, key)
    if (stat === null) {
      stat = 0
    }
  }
  return stat
}

export const getUsageStats = async (ctx: MetloContext) => {
  const statsQuery = `
    SELECT
      DATE_TRUNC('day', traces.hour) as day,
      SUM(traces."numCalls") as cnt
    FROM ${AggregateTraceDataHourly.getTableName(ctx)} traces
    WHERE traces.hour > (NOW() - INTERVAL '15 days')
    GROUP BY 1
    ORDER BY 1
  `
  const stats: {
    day: string
    cnt: number
  }[] = await DatabaseService.executeRawQuery(statsQuery)
  return {
    dailyUsage: stats,
    last1MinCnt: await getLastMinCounts(ctx),
  } as UsageStats
}

export const getUsageStatsCached = async (ctx: MetloContext) => {
  const cacheRes: UsageStats | null = await RedisClient.getFromRedis(
    ctx,
    "usageStats",
  )
  if (cacheRes) {
    return cacheRes
  }
  const start = performance.now()
  const realRes = await getUsageStats(ctx)
  mlog.time("backend.get_usage_stats", performance.now() - start)
  await RedisClient.addToRedis(ctx, "usageStats", realRes, 60)
  return realRes
}

interface CountsResponse {
  newAlerts: number
  endpointsTracked: number
  piiDataFields: number
  hostCount: number
  highRiskAlerts: number
}

export const getCounts = async (ctx: MetloContext) => {
  const newAlertQuery = `
    SELECT
      CAST(COUNT(*) AS INTEGER) as count,
      CAST(SUM(CASE WHEN "riskScore" = 'high' THEN 1 ELSE 0 END) AS INTEGER) as high_risk_count
    FROM ${Alert.getTableName(ctx)} alert WHERE status = 'Open'
  `
  const endpointsTrackedQuery = `
    SELECT
      CAST(COUNT(*) AS INTEGER) as endpoint_count,
      CAST(COUNT(DISTINCT(host)) AS INTEGER) as host_count
    FROM ${ApiEndpoint.getTableName(ctx)} api_endpoint
  `
  const piiDataFieldsQuery = `
    SELECT CAST(COUNT(*) AS INTEGER) as count
    FROM ${DataField.getTableName(ctx)} data_field WHERE "dataTag" = 'PII'
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

export const getCountsCached = async (ctx: MetloContext) => {
  const cacheRes: CountsResponse | null = await RedisClient.getFromRedis(
    ctx,
    "usageCounts",
  )
  if (cacheRes) {
    return cacheRes
  }
  const start = performance.now()
  const realRes = await getCounts(ctx)
  mlog.time("backend.get_counts", performance.now() - start)
  if (realRes.hostCount > 0) {
    await RedisClient.addToRedis(ctx, "usageCounts", realRes, 60)
  }
  return realRes
}
