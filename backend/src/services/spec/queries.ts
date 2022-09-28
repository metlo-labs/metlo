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

export const insertAggregateMinutelyQuery = `
  WITH traces_by_minute AS (
    SELECT
        minute,
        SUM("numCalls") as "numCalls",
        SUM("maxRPS") as "maxRPS",
        SUM("minRPS") as "minRPS",
        SUM("meanRPS") as "meanRPS"
    FROM "aggregate_trace_data_minutely"
    WHERE "apiEndpointUuid" = ANY($1)
    GROUP BY minute
  ),
  traces_by_minute_status AS (
    SELECT
        minute,
        CAST(d.key AS INTEGER) as "status",
        SUM(CAST(d.value AS BIGINT)) as "numTraces"
    FROM "aggregate_trace_data_minutely" tmp
    JOIN jsonb_each_text(tmp."countByStatusCode") d ON TRUE
    WHERE tmp."apiEndpointUuid" = ANY($1)
    GROUP BY 1, 2
  ),
  minute_count_by_status_code AS (
    SELECT
        minute,
        replace(
            array_to_string(array_agg(json_build_object(status, "numTraces")), ''),
            '}{',
            ', '
        )::json AS "countByStatusCode"
    FROM traces_by_minute_status
    GROUP BY 1
  )
  INSERT INTO aggregate_trace_data_minutely ("minute", "numCalls", "maxRPS", "minRPS", "meanRPS", "countByStatusCode", "apiEndpointUuid")
  SELECT
    traces.minute,
    traces."numCalls",
    traces."maxRPS",
    traces."minRPS",
    traces."meanRPS",
    status_code_map."countByStatusCode",
    $2 as "apiEndpointUuid"
  FROM traces_by_minute traces
  JOIN minute_count_by_status_code status_code_map ON traces.minute = status_code_map.minute
`
