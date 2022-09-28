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
const newTracesByMinuteStatus = `
  SELECT
    "apiEndpointUuid",
    DATE_TRUNC('minute', second) as minute,
    status,
    SUM("numTraces") as "numTraces"
  FROM traces_by_second_status
  GROUP BY 1, 2, 3
`
const savedTracesByMinuteStatus = `
  SELECT
    "apiEndpointUuid",
    minute,
    CAST(d.key AS INTEGER) as "status",
    SUM(CAST(d.value AS BIGINT)) as "numTraces"
  FROM "aggregate_trace_data_minutely" tmp
  JOIN jsonb_each_text(tmp."countByStatusCode") d ON TRUE
  WHERE "minute" <= $1
  GROUP BY 1, 2, 3
`
const tracesByMinuteStatus = `
  traces_by_minute_status_union AS (
    ${newTracesByMinuteStatus}
    UNION ALL
    ${savedTracesByMinuteStatus}
  ),
  traces_by_minute_status AS (
    SELECT
      "apiEndpointUuid",
      minute,
      status,
      SUM("numTraces") as "numTraces"
    FROM traces_by_minute_status_union
    GROUP BY 1, 2, 3
  )
`
const newTracesByMinute = `
  SELECT
    "apiEndpointUuid",
    DATE_TRUNC('minute', second) as minute,
    MAX("numTraces") as "maxRPS",
    MIN("numTraces") as "minRPS",
    SUM("numTraces"::numeric)/60.0 as "meanRPS",
    SUM("numTraces") as "numTraces",
    COUNT(*) as num_secs_with_data
  FROM traces_by_second_status
  GROUP BY 1, 2
`
const savedTracesByMinute = `
  SELECT
    "apiEndpointUuid",
    "minute",
    "maxRPS",
    "minRPS",
    "meanRPS",
    "numCalls" as "numTraces",
    CASE WHEN "minRPS" > 0 THEN 60 ELSE 0 END as num_secs_with_data
  FROM aggregate_trace_data_minutely
  WHERE minute <= $1
`
const tracesByMinute = `
  traces_by_minute_union AS (
    ${newTracesByMinute}
    UNION ALL
    ${savedTracesByMinute}
  ),
  traces_by_minute AS (
    SELECT
      "apiEndpointUuid",
      minute,
      MAX("maxRPS") as "maxRPS",
      MIN("minRPS") as "minRPS",
      SUM("numTraces"::numeric)/60.0 as "meanRPS",
      SUM("numTraces") as "numTraces",
      MAX("num_secs_with_data") as num_secs_with_data
    FROM traces_by_minute_union
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
  ON CONFLICT ("apiEndpointUuid", "minute")
  DO UPDATE SET
    "maxRPS" = EXCLUDED."maxRPS",
    "minRPS" = EXCLUDED."minRPS",
    "meanRPS" = EXCLUDED."meanRPS",
    "numCalls" = EXCLUDED."numCalls", 
    "countByStatusCode" = EXCLUDED."countByStatusCode"
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
