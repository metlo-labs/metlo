import { DataClass } from "@common/enums"
import {
  GetSensitiveDataAggParams,
  PIIDataClassAggItem,
  SensitiveDataSummary,
} from "@common/types"
import { DATA_CLASS_TO_RISK_SCORE } from "@common/maps"
import { AppDataSource } from "data-source"
import cache from "memory-cache"
import { DatabaseService } from "services/database"

export const getPIIDataTypeCount = async () => {
  const piiDataTypeCountRes: { type: DataClass; cnt: number }[] =
    await DatabaseService.executeRawQueries(`
      SELECT data_class as type, CAST(COUNT(*) AS INTEGER) as cnt
      FROM (SELECT UNNEST("dataClasses") as data_class FROM data_field) tbl
      GROUP BY 1
    `)
  return Object.fromEntries(piiDataTypeCountRes.map(e => [e.type, e.cnt]))
}

export const getPIIDataTypeCountCached = async () => {
  const cacheRes: Record<DataClass, number> | null =
    cache.get("PIIDataTypeCount")
  if (cacheRes) {
    return cacheRes
  }
  const realRes = await getPIIDataTypeCount()
  cache.put("PIIDataTypeCount", realRes, 5000)
  return realRes
}

export const getPIIDataTypeAgg = async (params: GetSensitiveDataAggParams) => {
  const queryRunner = AppDataSource.createQueryRunner()

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
  const riskMap = Object.values(DataClass)
    .map(
      e =>
        `WHEN unnest_fields.data_class = '${e}' THEN '${DATA_CLASS_TO_RISK_SCORE[e]}'`,
    )
    .join("\n")
  const riskCase = `CASE ${riskMap} END`

  let dataFieldFilter = ""
  if (dataFieldFilters.length > 0) {
    dataFieldFilter = `WHERE ${dataFieldFilters.join(" AND ")}`
  }

  const filtered_data_fields = `
    SELECT data_field.*, api_endpoint.host as host
    FROM data_field
    JOIN api_endpoint ON data_field."apiEndpointUuid" = api_endpoint.uuid
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

  const piiDataTypeRes: PIIDataClassAggItem[] = await queryRunner.query(
    piiQuery,
    queryParams,
  )
  const endpointRes: { count: number }[] = await queryRunner.query(
    endpointQuery,
    queryParams,
  )

  await queryRunner.release()

  return {
    piiDataTypeCount: Object.fromEntries(
      piiDataTypeRes.map(e => [e.dataClass, e.count]),
    ) as any,
    piiItems: piiDataTypeRes,
    totalPIIFields: piiDataTypeRes.map(e => e.count).reduce((a, b) => a + b, 0),
    totalEndpoints: endpointRes[0].count,
  } as SensitiveDataSummary
}
