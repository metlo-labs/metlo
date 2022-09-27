const tracesBySecondStatus = `
  WITH traces_by_second_status AS (
    SELECT
      "apiEndpointUuid",
      DATE_TRUNC('second', traces."createdAt") as second,
      "responseStatus" as status,
      COUNT(*) as "numTraces"
    FROM api_trace traces
    WHERE
      "apiEndpointUuid" IS NOT NULL
      AND analyzed = TRUE
      AND "createdAt" <= $1
    GROUP BY 1, 2, 3
  )
`
const tracesByMinuteStatus = `
  traces_by_minute_status AS (
    SELECT
      "apiEndpointUuid",
      DATE_TRUNC('minute', second) as minute,
      status,
      SUM("numTraces") as "numTraces"
    FROM traces_by_second_status
    GROUP BY 1, 2, 3
  )
`
const tracesByMinute = `
  traces_by_minute AS (
    SELECT
      "apiEndpointUuid",
      DATE_TRUNC('minute', second) as minute,
      MAX("numTraces") as "maxRPS",
      MIN("numTraces") as "minRPS",
      AVG("numTraces") as "meanRPS",
      SUM("numTraces") as "numTraces",
      COUNT(*) as num_secs_with_data
    FROM traces_by_second_status
    GROUP BY 1, 2
  )
`
const minuteCountByStatusCode = `
  minute_count_by_status_code AS (
    SELECT
      "apiEndpointUuid",
      minute,
      replace(
        array_to_string(array_agg(json_build_object(status, "numTraces")), ''),
        '}{',
        ', '
      )::json AS "countByStatusCode"
    FROM traces_by_minute_status
    GROUP BY 1, 2
  )
`
export const aggregateTracesDataMinutelyQuery = `
  ${tracesBySecondStatus},
  ${tracesByMinuteStatus},
  ${tracesByMinute},
  ${minuteCountByStatusCode}
  INSERT INTO aggregate_trace_data_minutely ("apiEndpointUuid", "minute", "maxRPS", "minRPS", "meanRPS", "numCalls", "countByStatusCode")
  SELECT
    traces."apiEndpointUuid",
    traces.minute,
    traces."maxRPS",
    CASE WHEN traces.num_secs_with_data < 60 THEN 0 ELSE traces."minRPS" END as "minRPS",
    traces."meanRPS",
    traces."numTraces" as "numCalls",
    status_code_map."countByStatusCode"
  FROM traces_by_minute traces
  JOIN minute_count_by_status_code status_code_map ON
    traces.minute = status_code_map.minute AND traces."apiEndpointUuid" = status_code_map."apiEndpointUuid"
`

export const aggregateTracesDataHourlyQuery = `
  INSERT INTO aggregate_trace_data_hourly ("apiEndpointUuid", "hour", "numCalls")
  SELECT
    "apiEndpointUuid",
    DATE_TRUNC('hour', "createdAt") as hour,
    COUNT(*) as "numCalls"
  FROM api_trace traces
  WHERE
    "apiEndpointUuid" IS NOT NULL
    AND analyzed = TRUE
    AND "createdAt" <= $1
  GROUP BY 1, 2
  ON CONFLICT ON CONSTRAINT unique_constraint_hourly
  DO UPDATE SET "numCalls" = EXCLUDED."numCalls" + aggregate_trace_data_hourly."numCalls"
`