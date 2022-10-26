export const aggregateTracesDataHourlyQuery = `
  INSERT INTO aggregate_trace_data_hourly ("apiEndpointUuid", "hour", "numCalls")
  SELECT
    "apiEndpointUuid",
    DATE_TRUNC('hour', "createdAt") as hour,
    COUNT(*) as "numCalls"
  FROM api_trace traces
  WHERE
    "apiEndpointUuid" IS NOT NULL
    AND "createdAt" <= $1
  GROUP BY 1, 2
  ON CONFLICT ON CONSTRAINT unique_constraint_hourly
  DO UPDATE SET "numCalls" = EXCLUDED."numCalls" + aggregate_trace_data_hourly."numCalls"
`

export const updateUnauthenticatedEndpoints = `
  UPDATE api_endpoint
  SET "isAuthenticatedDetected" = FALSE
  WHERE uuid IN (
    SELECT
      DISTINCT("apiEndpointUuid")
    FROM api_trace
    WHERE
      "sessionMeta" ->> 'authenticationProvided' = 'false'
      AND "sessionMeta" ->> 'authenticationSuccessful' = 'true'
  )
`

export const getUnauthenticatedEndpointsSensitiveData = `
  With endpoints AS (
    SELECT
      endpoint.uuid,
      endpoint.path,
      endpoint.method,
      endpoint.host
    FROM
      "api_endpoint" "endpoint"
      LEFT JOIN "data_field" "field" ON "field" ."apiEndpointUuid" = "endpoint" ."uuid"
    WHERE
      (
        endpoint."isAuthenticatedDetected" = FALSE
        OR endpoint."isAuthenticatedUserSet" = FALSE
      )
      AND field."dataSection" = $1
      AND field."dataTag" = $2
    GROUP BY
      1
  )
  SELECT
    *
  FROM
    endpoints
  WHERE
    endpoints.uuid NOT IN (
      SELECT
        "apiEndpointUuid"
      FROM
        alert
      WHERE
        alert."apiEndpointUuid" = endpoints.uuid
        AND alert.type = $3
        AND alert.status != $4
    )
`
