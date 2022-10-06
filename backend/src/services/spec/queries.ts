export const deleteOpenAPISpecDiffAlerts = `
  DELETE
  FROM alert
  WHERE type = 'Open API Spec Diff'
  AND "apiEndpointUuid" IN (
    SELECT
      uuid
    FROM api_endpoint
    WHERE "openapiSpecName" = $1
  )
`

export const insertDataFieldQuery = `
  WITH arr_aggs as (
    SELECT
      uuid,
      unnest("dataClasses") as "dataClasses",
      unnest("scannerIdentified") as "scannerIdentified",
      unnest("falsePositives") as "falsePositives"
    FROM data_field
    WHERE
      "apiEndpointUuid" = ANY($1)
  )
  INSERT INTO data_field ("dataClasses", "falsePositives", "scannerIdentified", "dataType", "dataTag", "createdAt", "updatedAt", "dataSection", "dataPath", "apiEndpointUuid")
  SELECT
    COALESCE(array_agg(DISTINCT arr_aggs."dataClasses") filter (where arr_aggs."dataClasses" IS NOT NULL), '{}') as "dataClasses",
    COALESCE(array_agg(DISTINCT arr_aggs."falsePositives") filter (where arr_aggs."falsePositives" IS NOT NULL), '{}') as "falsePositives",
    COALESCE(array_agg(DISTINCT arr_aggs."scannerIdentified") filter (where arr_aggs."scannerIdentified" IS NOT NULL), '{}') as "scannerIdentified",
    MIN("dataType") as "dataType",
    MAX("dataTag") as "dataTag",
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt",
    "dataSection",
    "dataPath",
    $2 as "apiEndpointUuid"
  FROM
    "data_field"
  LEFT JOIN "arr_aggs" ON "data_field".uuid = "arr_aggs".uuid
  WHERE
    "apiEndpointUuid" = ANY($1)
  GROUP BY
    "dataSection",
    "dataPath"
  ON CONFLICT ON CONSTRAINT unique_constraint_data_field DO NOTHING
`

export const insertAggregateHourlyQuery = `
  INSERT INTO aggregate_trace_data_hourly ("hour", "numCalls", "apiEndpointUuid")
  SELECT
      hour,
      SUM("numCalls") as "numCalls",
      $1 as "apiEndpointUuid"
  FROM "aggregate_trace_data_hourly"
  WHERE "apiEndpointUuid" = ANY($2)
  GROUP BY hour
`
