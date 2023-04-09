import groupBy from "lodash/groupBy"
import { In } from "typeorm"
import { AggregateTraceDataHourly, ApiEndpoint, ApiTrace } from "models"
import { DatabaseService } from "services/database"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { getRepository } from "services/database/utils"
import mlog from "logger"
import { ApiEndpointDetailed } from "@common/types"

export const getTopEndpoints = async (ctx: MetloContext) => {
  const apiEndpointRepository = getRepository(ctx, ApiEndpoint)
  const startEndpointStats = performance.now()
  const endpointStats: {
    endpoint: string
    last1MinCnt: number
    last5MinCnt: number
    last30MinCnt: number
  }[] = await DatabaseService.executeRawQuery(`
    SELECT
      traces."apiEndpointUuid" AS endpoint,
      SUM("numCalls") AS "numCalls"
    FROM
      ${AggregateTraceDataHourly.getTableName(ctx)} traces
    WHERE
      traces.hour > (NOW() - INTERVAL '2 hours')
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  `)
  mlog.time(
    "backend.get_top_endpoints.endpoint_stats",
    performance.now() - startEndpointStats,
  )

  const endpointsStart = performance.now()
  const endpoints = await apiEndpointRepository.find({
    where: { uuid: In(endpointStats.map(e => e.endpoint)) },
  })
  mlog.time(
    "backend.get_top_endpoints.endpoints",
    performance.now() - endpointsStart,
  )

  const tracesStart = performance.now()
  const traces = await Promise.all(
    endpointStats.map(e =>
      RedisClient.lrange(ctx, `endpointTraces:e#${e.endpoint}`, 0, 20),
    ),
  )
  mlog.time("backend.get_top_endpoints.traces", performance.now() - tracesStart)
  const traceMap = groupBy(
    traces.flat().map(e => JSON.parse(e) as ApiTrace),
    e => e.apiEndpointUuid,
  )

  return endpointStats.map(
    stats =>
      ({
        ...endpoints.find(e => e.uuid == stats.endpoint),
        traces: traceMap[stats.endpoint],
        tests: [],
        graphQlSchema: null,
      } as ApiEndpointDetailed),
  )
}

export const getTopEndpointsCached = async (ctx: MetloContext) => {
  const cacheRes: ApiEndpointDetailed[] | null = await RedisClient.getFromRedis(
    ctx,
    "endpointUsageStats",
  )
  if (cacheRes) {
    return cacheRes
  }
  const start = performance.now()
  const realRes = await getTopEndpoints(ctx)
  mlog.time("backend.get_top_endpoints", performance.now() - start)
  await RedisClient.addToRedis(ctx, "endpointUsageStats", realRes, 15)
  return realRes
}
