import { Alert, ApiEndpoint, ApiTrace, DataField } from "models"
import { MetloContext } from "types"

export const getUnauthenticatedEndpointsSensitiveData = (ctx: MetloContext) => `
  With endpoints AS (
    SELECT DISTINCT
      endpoint.uuid,
      endpoint.path,
      endpoint.method,
      endpoint.host
    FROM
      ${ApiEndpoint.getTableName(ctx)} "endpoint"
      LEFT JOIN ${DataField.getTableName(ctx)} "field" ON "field" ."apiEndpointUuid" = "endpoint" ."uuid"
    WHERE
      (
        endpoint."isAuthenticatedDetected" = FALSE
        OR endpoint."isAuthenticatedUserSet" = FALSE
      )
      AND field."dataSection" = $1
      AND field."dataTag" = $2
  )
  SELECT
    *
  FROM
    endpoints
  WHERE
    endpoints.uuid NOT IN (
      SELECT
        "apiEndpointUuid"
      FROM ${Alert.getTableName(ctx)} alert
      WHERE
        alert."apiEndpointUuid" = endpoints.uuid
        AND alert.type = $3
        AND alert.status != $4
    )
`
