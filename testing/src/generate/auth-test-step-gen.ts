import { TemplateConfig } from "types/resource_config"
import {
  AuthActor,
  getAccessItems,
  getAllAuthActors,
  getEndpointPermissions,
  getEndpointRequestEntities,
} from "./permissions"
import { GenTestEndpoint } from "./types"

interface TestStepPayload {
  authActorEntity: AuthActor
  entities: Record<string, any>
  authorized: boolean
  reason?: string
}

export const getAuthTestPayloads = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): TestStepPayload[] => {
  const host = config.hosts[endpoint.host]
  if (!host || !host.authType) {
    throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
  }
  const endpointReqEnts = getEndpointRequestEntities(endpoint, config)
  const resourcePerms = getEndpointPermissions(endpoint, config)
  const allAuthActors = getAllAuthActors(config)

  let payloads: TestStepPayload[] = []
  for (const authActor of allAuthActors) {
    const accessItems = getAccessItems(authActor, resourcePerms, config)
    let hasAccessItems = accessItems.hasAccess
    let notHasAccessItems = accessItems.notHasAccess

    const accessEnts = new Set(
      Object.entries(hasAccessItems)
        .filter(([k, v]) => v.length > 0)
        .map(([k, v]) => k),
    )
    const noAccessEnts = new Set(
      Object.entries(notHasAccessItems)
        .filter(([k, v]) => v.length > 0)
        .map(([k, v]) => k),
    )
    const accessPossible = Object.keys(resourcePerms).every(
      e => accessEnts.has(e) || accessItems.resourceLevelAccess[e],
    )
    const noResourceLevelAccessItems = Object.keys(resourcePerms).filter(
      e => accessItems.resourceLevelAccess[e] === false,
    )
    const resourceLevelAccessItems = Object.entries(
      accessItems.resourceLevelAccess,
    )
      .filter(([k, v]) => v)
      .map(([k, v]) => k)
    const defaultPayloadEntities = Object.fromEntries(
      Object.entries(hasAccessItems).map(([k, v]) => [k, v[0]]),
    )

    if (noResourceLevelAccessItems.length > 0) {
      let payload: TestStepPayload = {
        authActorEntity: authActor,
        entities: defaultPayloadEntities,
        authorized: false,
      }
      if (resourceLevelAccessItems) {
        payload.reason = `Doesn't have access to resources ${noResourceLevelAccessItems.join(
          " and ",
        )}`
      }
      payloads.push(payload)
      continue
    }

    if (accessPossible) {
      let payload: TestStepPayload = {
        authActorEntity: authActor,
        entities: Object.fromEntries(
          Object.entries(hasAccessItems).map(([k, v]) => [k, v[0]]),
        ),
        authorized: true,
      }
      if (resourceLevelAccessItems.length > 0) {
        payload.reason = `Has access to ${resourceLevelAccessItems.join(
          " and ",
        )}`
      }
      payloads.push(payload)
    }
    for (const noAccessEnt of noAccessEnts) {
      const payloadNoAccessEntities = {
        [noAccessEnt]: notHasAccessItems[noAccessEnt][0],
      }
      payloads.push({
        authActorEntity: authActor,
        entities: {
          ...defaultPayloadEntities,
          ...payloadNoAccessEntities,
        },
        authorized: false,
      })
    }
  }
  return payloads
}
