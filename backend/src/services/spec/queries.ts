import { AggregateTraceDataHourly, ApiEndpoint } from "models"
import { MetloContext } from "types"

export const deleteOpenAPISpecDiffAlerts = (ctx: MetloContext) => `
  DELETE
  FROM alert
  WHERE type = 'Open API Spec Diff'
  AND "apiEndpointUuid" IN (
    SELECT
      uuid
    FROM ${ApiEndpoint.getTableName(ctx)} api_endpoint
    WHERE "openapiSpecName" = $1
  )
`

export const getAllOldEndpoints = (ctx: MetloContext) => `
  SELECT
    COALESCE(array_agg(DISTINCT "oldUuids"), '{}') as "uuids"
  FROM
    ${ApiEndpoint.getTableName(ctx)} api_endpoint,
    unnest("oldEndpointUuids") as "oldUuids"
  WHERE
    uuid = ANY($1)
`

export const updateOldEndpointUuids = `
  UPDATE api_endpoint
  SET "oldEndpointUuids" = array_cat("oldEndpointUuids", $1)
  WHERE uuid = $2
`

export const insertAggregateHourlyQuery = (ctx: MetloContext) => `
  INSERT INTO aggregate_trace_data_hourly ("hour", "numCalls", "apiEndpointUuid")
  SELECT
      hour,
      SUM("numCalls") as "numCalls",
      $1 as "apiEndpointUuid"
  FROM ${AggregateTraceDataHourly.getTableName(ctx)} agg
  FROM "aggregate_trace_data_hourly"
  WHERE "apiEndpointUuid" = ANY($2)
  GROUP BY 1
`
