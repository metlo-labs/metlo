import { TemplateConfig } from "@metlo/testing"
import { ApiEndpoint, DataField } from "models"
import { getQB } from "services/database/utils"
import { QueryRunner } from "typeorm"
import { MetloContext } from "types"

export const populateEndpointPerms = async (
  ctx: MetloContext,
  queryRunner: QueryRunner,
  testingConf: TemplateConfig,
): Promise<void> => {
  if (Object.keys(testingConf.resources).length == 0) {
    return
  }

  let argNumber = 1
  let parameters: any[] = []
  let permissionToQuery: Record<string, string[]> = {}
  Object.entries(testingConf.resources).forEach(([name, resource]) => {
    resource.endpoints.forEach(endpointRule => {
      let query: string[] = []
      if (endpointRule.host) {
        query.push(`(host ~ $${argNumber++})`)
        parameters.push(endpointRule.host)
      }
      if (endpointRule.path) {
        query.push(`(path ~ $${argNumber++})`)
        parameters.push(endpointRule.path)
      }
      if (endpointRule.method) {
        query.push(`(method = $${argNumber++})`)
        parameters.push(endpointRule.method)
      }
      if (endpointRule.contains_resource) {
        query.push(`(entity_map #> $${argNumber++} IS NOT NULL)`)
        parameters.push(`{${name}, ${endpointRule.contains_resource.path}}`)
      }
      endpointRule.permissions.forEach(perm => {
        const resourcePermName = `${name}.${perm}`
        let currentQueries = permissionToQuery[resourcePermName] || []
        currentQueries.push(`(${query.join(" AND ")})`)
        permissionToQuery[resourcePermName] = currentQueries
      })
    })
  })

  let idxToPermission: Record<number, string> = {}
  let permSelects = []
  Object.entries(permissionToQuery).forEach(([permission, queries], i) => {
    idxToPermission[i] = permission
    permSelects.push(`(${queries.join(" OR ")}) AS permission_${i}`)
  })

  const permissionUpdateQuery = `
    WITH endpoint_to_entities AS (
        SELECT
            "apiEndpointUuid" as endpoint_uuid,
            jsonb_object_agg(ent, data_section_map) AS entity_map
        FROM (
            SELECT
                "apiEndpointUuid",
                split_part(entity,  '.', 1) AS ent,
                jsonb_object_agg("dataSection", true) AS data_section_map
            FROM ${DataField.getTableName(ctx)} data_field
            WHERE entity != ''
            GROUP BY 1, 2
        ) tbl GROUP BY 1
    ),
    api_endpoint_info AS (
        SELECT
            endpoints.uuid,
            endpoints.method,
            endpoints.host,
            endpoints.path,
            end_to_ents.entity_map
        FROM ${ApiEndpoint.getTableName(ctx)} endpoints
        LEFT JOIN endpoint_to_entities end_to_ents ON
            endpoints.uuid = end_to_ents.endpoint_uuid
    ),
    endpoint_to_perm AS (
        SELECT
            api_endpoint_info.uuid,
            ${permSelects.join(",\n        ")}
        FROM api_endpoint_info
    ),
    updated_permissions AS (
        SELECT
            endpoints.uuid as api_endpoint_uuid,
            ${Object.keys(idxToPermission)
              .map(
                e =>
                  `(CASE WHEN perm_map.permission_${e} THEN ARRAY['${idxToPermission[e]}'] ELSE ARRAY[]::varchar[] END)`,
              )
              .join(" || ")} AS resources
        FROM ${ApiEndpoint.getTableName(ctx)} endpoints
        JOIN endpoint_to_perm perm_map ON
            endpoints.uuid = perm_map.uuid
        WHERE
            ${Object.keys(idxToPermission)
              .map(e => `perm_map.permission_${e}`)
              .join(" OR ")}
    )
    UPDATE api_endpoint
    SET "resourcePermissions" = COALESCE(perms.resources, ARRAY[]::varchar[])
    FROM updated_permissions perms WHERE
        api_endpoint.uuid = perms.api_endpoint_uuid;
  `

  await getQB(ctx, queryRunner)
    .update(ApiEndpoint)
    .set({
      resourcePermissions: [],
    })
    .execute()
  await queryRunner.query(permissionUpdateQuery, parameters)
}
