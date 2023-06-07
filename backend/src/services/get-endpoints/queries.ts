import { ApiEndpoint, DataField, Hosts } from "models"
import { MetloContext } from "types"

export const getEndpointsQuery = (
  ctx: MetloContext,
  whereFilter: string,
  limitFilter: string,
  offsetFilter: string,
) => `
  SELECT
    endpoint.*,
    data_field."dataClasses",
    COALESCE("hosts"."isPublic", false) as "isPublic"
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
    LEFT JOIN ${Hosts.getTableName(ctx)} hosts
      on "hosts"."host" = "endpoint"."host"
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
    LEFT JOIN ${Hosts.getTableName(ctx)} hosts
      on "hosts"."host" = "endpoint"."host"
  ${whereFilter}
`

export const getNewDetectionsAggQuery = (ctx: MetloContext) => `
SELECT
  day,
  SUM(num_endpoints) as "numEndpoints",
  SUM(num_fields) as "numFields"
FROM
  (
      SELECT
          DATE_TRUNC('day', "api_endpoint" ."createdAt") as day,
          COUNT(*) AS num_endpoints,
          NULL AS num_fields
      FROM
        ${ApiEndpoint.getTableName(ctx)} api_endpoint
      WHERE
          "createdAt" >= NOW() - interval '1000 days'
      GROUP BY
          day
      UNION ALL
      SELECT
          DATE_TRUNC('day', "data_field" ."createdAt") as day,
          NULL AS "numEndpoints",
          COUNT(*) AS num_fields
      FROM
          ${DataField.getTableName(ctx)} data_field
      WHERE
          "createdAt" >= NOW() - interval '1000 days'
      GROUP BY
          day
  ) AS combined_data
GROUP BY
  day
ORDER BY
  day DESC
LIMIT 20;
`
