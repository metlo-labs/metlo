import { AlertType, VULNERABILITY_ALERT_TYPES } from "@common/enums"
import {
  GetVulnerabilityAggParams,
  VulnerabilityAggItem,
  VulnerabilitySummary,
} from "@common/types"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import { Alert } from "models"
import { MetloContext } from "types"
import { DatabaseService } from "services/database"

export const getVulnerabilityAgg = async (
  ctx: MetloContext,
  params: GetVulnerabilityAggParams,
) => {
  let queryParams = []
  let alertFilters: string[] = []

  if ((params.hosts || []).length > 0) {
    alertFilters.push(`api_endpoint.host = ANY($${queryParams.length + 1})`)
    queryParams.push(params.hosts)
  }
  const riskMap = Object.values(AlertType)
    .map(e => `WHEN alert.type = '${e}' THEN '${ALERT_TYPE_TO_RISK_SCORE[e]}'`)
    .join("\n")
  const riskCase = `CASE ${riskMap} END`
  if ((params.riskScores || []).length > 0) {
    alertFilters.push(`(${riskCase}) = ANY($${queryParams.length + 1})`)
    queryParams.push(params.riskScores)
  }
  alertFilters.push(
    `alert.type IN (${VULNERABILITY_ALERT_TYPES.map(e => `'${e}'`).join(
      ", ",
    )})`,
  )
  alertFilters.push("alert.status = 'Open'")

  let alertFilter = ""
  if (alertFilters.length > 0) {
    alertFilter = `WHERE ${alertFilters.join(" AND ")}`
  }

  const alertQuery = `
    SELECT
      alert.*,
      ${riskCase} as risk,
      api_endpoint.host as host
    FROM ${Alert.getTableName(ctx)} alert
    JOIN api_endpoint ON alert."apiEndpointUuid" = api_endpoint.uuid
    ${alertFilter}
  `

  const vulnerabilityQuery = `
    WITH filtered_alerts AS (${alertQuery})
    SELECT
      type as type,
      risk as risk,
      CAST(COUNT(*) AS INTEGER) as count,
      CAST(COUNT(DISTINCT(host)) AS INTEGER) AS "numHosts",
      CAST(COUNT(DISTINCT("apiEndpointUuid")) AS INTEGER) AS "numEndpoints"
    FROM filtered_alerts 
    GROUP BY 1, 2
  `

  const endpointQuery = `
    WITH filtered_alerts AS (${alertQuery})
    SELECT CAST(COUNT(DISTINCT("apiEndpointUuid")) AS INTEGER) as count
    FROM filtered_alerts 
  `

  const vulnerabilityItemRes: VulnerabilityAggItem[] =
    await DatabaseService.executeRawQuery(vulnerabilityQuery, queryParams)
  const endpointRes: { count: number }[] =
    await DatabaseService.executeRawQuery(endpointQuery, queryParams)

  return {
    vulnerabilityTypeCount: Object.fromEntries(
      vulnerabilityItemRes.map(e => [e.type, e.count]),
    ) as any,
    vulnerabilityItems: vulnerabilityItemRes,
    totalVulnerabilities: vulnerabilityItemRes
      .map(e => e.count)
      .reduce((a, b) => a + b, 0),
    totalEndpoints: endpointRes[0].count,
  } as VulnerabilitySummary
}
