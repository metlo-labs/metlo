import _ from "lodash"
import { In } from "typeorm"
import { AppDataSource } from "data-source"
import { ApiEndpoint, ApiTrace } from "models"
import { EndpointAndUsage } from "@common/types"
import cache from "memory-cache"

export const getTopEndpoints = async () => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
  const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
  const endpointStats: {
    endpoint: string
    last1MinCnt: number
    last5MinCnt: number
    last30MinCnt: number
  }[] = await queryRunner.manager.query(`
      SELECT
        traces."apiEndpointUuid" as endpoint,
        CAST(COUNT(*) AS INTEGER) as "last30MinCnt",
        CAST(SUM(CASE WHEN traces."createdAt" > (NOW() - INTERVAL '5 minutes') THEN 1 ELSE 0 END) AS INTEGER) as "last5MinCnt",
        CAST(SUM(CASE WHEN traces."createdAt" > (NOW() - INTERVAL '1 minutes') THEN 1 ELSE 0 END) AS INTEGER) as "last1MinCnt"
      FROM
        api_trace traces
      WHERE
        traces."apiEndpointUuid" IS NOT NULL
        AND traces."createdAt" > (NOW() - INTERVAL '30 minutes')
      GROUP BY 1
      ORDER BY 4 DESC
      LIMIT 10
    `)

  const endpoints = await apiEndpointRepository.find({
    where: { uuid: In(endpointStats.map(e => e.endpoint)) },
    relations: {
      dataFields: true,
    },
    order: {
      dataFields: {
        dataTag: "ASC",
        dataPath: "ASC",
      },
    },
  })

  const traces = await Promise.all(
    endpointStats.map(e =>
      apiTraceRepository.find({
        where: { apiEndpointUuid: e.endpoint },
        order: { createdAt: "DESC" },
        take: 25,
      }),
    ),
  )
  const traceMap = _.groupBy(traces.flat(), e => e.apiEndpointUuid)

  await queryRunner.release()

  return endpointStats.map(
    stats =>
      ({
        ...endpoints.find(e => e.uuid == stats.endpoint),
        last30MinCnt: stats.last30MinCnt,
        last5MinCnt: stats.last5MinCnt,
        last1MinCnt: stats.last1MinCnt,
        traces: traceMap[stats.endpoint],
        tests: [],
      } as EndpointAndUsage),
  )
}

export const getTopEndpointsCached = async () => {
  const cacheRes: EndpointAndUsage[] | null = cache.get("endpointUsageStats")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getTopEndpoints()
  cache.put("endpointUsageStats", realRes, 15000)
  return realRes
}
