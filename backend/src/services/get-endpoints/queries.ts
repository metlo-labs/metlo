export const getEndpointsQuery = (
  whereFilter: string,
  limitFilter: string,
  offsetFilter: string,
) => `
  SELECT
    endpoint.*,
    data_field."dataClasses"
  FROM
    "api_endpoint" endpoint
    LEFT JOIN LATERAL (
      SELECT
        array_agg(DISTINCT "classes")::varchar[] as "dataClasses"
      FROM
        data_field,
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

export const getEndpointsCountQuery = (whereFilter: string) => `
  SELECT
    COUNT(endpoint.uuid) as count
  FROM
    "api_endpoint" endpoint
    LEFT JOIN LATERAL (
      SELECT
        array_agg(DISTINCT "classes") as "dataClasses"
      FROM
        data_field,
        unnest(data_field."dataClasses") as "classes"
      WHERE
        data_field."apiEndpointUuid" = endpoint.uuid
        AND cardinality(data_field."dataClasses") > 0
    ) data_field ON true
  ${whereFilter}
`
