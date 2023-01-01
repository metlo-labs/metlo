import { PIIDataClassAggItem, SensitiveDataSummary } from "@common/types"
import { GetSensitiveDataAggParams } from "@common/api/summary"
import { DatabaseService } from "services/database"
import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { getCombinedDataClasses } from "services/data-classes"

export const getPIIDataTypeCount = async (ctx: MetloContext) => {
  const piiDataTypeCountRes: { type: string; cnt: number }[] =
    await DatabaseService.executeRawQuery(`
      SELECT data_class as type, CAST(COUNT(*) AS INTEGER) as cnt
      FROM (SELECT UNNEST("dataClasses") as data_class FROM ${DataField.getTableName(
        ctx,
      )} data_field) tbl
      GROUP BY 1
    `)
  return Object.fromEntries(piiDataTypeCountRes.map(e => [e.type, e.cnt]))
}

export const getPIIDataTypeCountCached = async (ctx: MetloContext) => {
  const cacheRes: Record<string, number> | null =
    await RedisClient.getFromRedis(ctx, "PIIDataTypeCount")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getPIIDataTypeCount(ctx)
  await RedisClient.addToRedis(ctx, "PIIDataTypeCount", realRes, 5)
  return realRes
}

export const getPIIDataTypeAgg = async (
  ctx: MetloContext,
  params: GetSensitiveDataAggParams,
) => {
  let queryParams = []
  let dataFieldFilters: string[] = []
  let riskFilter = ""

  if ((params.locations || []).length > 0) {
    dataFieldFilters.push(
      `data_field."dataSection" = ANY($${queryParams.length + 1})`,
    )
    queryParams.push(params.locations)
  }
  if ((params.hosts || []).length > 0) {
    dataFieldFilters.push(`api_endpoint.host = ANY($${queryParams.length + 1})`)
    queryParams.push(params.hosts)
  }
  if ((params.riskScores || []).length > 0) {
    riskFilter = `WHERE risk = ANY($${queryParams.length + 1})`
    queryParams.push(params.riskScores)
  }

  const DataClassInfo = await getCombinedDataClasses(ctx)
  const riskMap = DataClassInfo.map(
    ({ className, severity }) =>
      `WHEN unnest_fields.data_class = '${className}' THEN '${severity}'`,
  ).join("\n")
  const riskCase = `CASE ${riskMap} END`

  let dataFieldFilter = ""
  if (dataFieldFilters.length > 0) {
    dataFieldFilter = `WHERE ${dataFieldFilters.join(" AND ")}`
  }

  const filtered_data_fields = `
    SELECT data_field.*, api_endpoint.host as host
    FROM ${DataField.getTableName(ctx)} data_field
    JOIN ${ApiEndpoint.getTableName(
      ctx,
    )} api_endpoint ON data_field."apiEndpointUuid" = api_endpoint.uuid
    ${dataFieldFilter}
  `
  const unnest_fields = `
    SELECT uuid, host, "apiEndpointUuid", UNNEST("dataClasses") as data_class
    FROM filtered_data_fields
  `

  const piiQuery = `
    WITH filtered_data_fields AS (${filtered_data_fields}),
    unnest_fields AS (${unnest_fields}),
    agg_data_fields AS (
      SELECT
        unnest_fields.data_class as "dataClass",
        ${riskCase} as risk,
        CAST(COUNT(*) AS INTEGER) as count,
        CAST(COUNT(DISTINCT(unnest_fields.host)) AS INTEGER) AS "numHosts",
        CAST(COUNT(DISTINCT(unnest_fields."apiEndpointUuid")) AS INTEGER) AS "numEndpoints"
      FROM unnest_fields 
      JOIN filtered_data_fields ON unnest_fields.uuid = filtered_data_fields.uuid
      GROUP BY 1
    )
    SELECT *
    FROM agg_data_fields
    ${riskFilter}
  `

  const endpointQuery = `
    WITH filtered_data_fields AS (${filtered_data_fields}),
    unnest_fields AS (${unnest_fields}),
    agg_data_fields AS (
      SELECT
        unnest_fields.data_class as "dataClass",
        ${riskCase} as risk,
        unnest_fields."apiEndpointUuid" AS endpoint_uuid
      FROM unnest_fields 
      JOIN filtered_data_fields ON unnest_fields.uuid = filtered_data_fields.uuid
    ),
    all_filtered_fields AS (
      SELECT *
      FROM agg_data_fields
      ${riskFilter}
    )
    SELECT CAST(COUNT(DISTINCT(endpoint_uuid)) AS INTEGER) as count
    FROM all_filtered_fields 
  `

  const piiDataTypeRes: PIIDataClassAggItem[] =
    await DatabaseService.executeRawQuery(piiQuery, queryParams)
  const endpointRes: { count: number }[] =
    await DatabaseService.executeRawQuery(endpointQuery, queryParams)

  return {
    piiDataTypeCount: Object.fromEntries(
      piiDataTypeRes.map(e => [e.dataClass, e.count]),
    ) as any,
    piiItems: piiDataTypeRes,
    totalPIIFields: piiDataTypeRes.map(e => e.count).reduce((a, b) => a + b, 0),
    totalEndpoints: endpointRes[0].count,
  } as SensitiveDataSummary
}
