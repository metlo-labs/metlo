import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"

export const getEndpointsQuery = (
  ctx: MetloContext,
  whereFilter: string,
  limitFilter: string,
  offsetFilter: string,
) => `
  SELECT
    endpoint.*,
    data_field."dataClasses"
  FROM
    ${ApiEndpoint.getTableName(ctx)} endpoint
    LEFT JOIN LATERAL (
      SELECT
        array_agg(DISTINCT "classes")::varchar[] as "dataClasses"
      FROM
        ${DataField.getTableName(ctx)} data_field,
        unnest(data_field."dataClasses") as "classes"
      WHERE
        data_field."apiEndpointUuid" = endpoint.uuid
        AND cardinality(data_field."dataClasses") > 0
    ) data_field ON true
  ${whereFilter}
  ORDER BY
    endpoint."riskScore" DESC,
    endpoint."lastActive" DESC NULLS LAST
  ${limitFilter}
  ${offsetFilter}
`

export const getEndpointsCountQuery = (
  ctx: MetloContext,
  whereFilter: string,
) => `
  SELECT
    COUNT(endpoint.uuid) as count
  FROM
    ${ApiEndpoint.getTableName(ctx)} endpoint
    LEFT JOIN LATERAL (
      SELECT
        array_agg(DISTINCT "classes") as "dataClasses"
      FROM
        ${DataField.getTableName(ctx)} data_field,
        unnest(data_field."dataClasses") as "classes"
      WHERE
        data_field."apiEndpointUuid" = endpoint.uuid
        AND cardinality(data_field."dataClasses") > 0
    ) data_field ON true
  ${whereFilter}
`
