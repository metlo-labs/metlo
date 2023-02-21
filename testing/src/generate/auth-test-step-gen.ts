import { AssertionType, AuthType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { KeyValType } from "../types/test"
import { TestStepBuilder } from "./builder"
import {
  AuthActor,
  getAccessItems,
  getAllAuthActors,
  getEndpointPermissions,
  getEndpointRequestEntities,
} from "./permissions"
import { makeSampleRequestNoAuth } from "./sample-request"
import { GeneratedTestRequest, GenTestContext, GenTestEndpoint } from "./types"

interface AuthTestStepPayload {
  authActorEntity: AuthActor
  entities: Record<string, any>
  authorized: boolean
  reason?: string
}

export const getAuthTestPayloads = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): AuthTestStepPayload[] => {
  const host = config.hosts[endpoint.host]
  if (!host || !host.authType) {
    throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
  }
  const endpointReqEnts = getEndpointRequestEntities(endpoint, config)
  const resourcePerms = getEndpointPermissions(endpoint, config)
  const allAuthActors = getAllAuthActors(config)

  let payloads: AuthTestStepPayload[] = []
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
      let payload: AuthTestStepPayload = {
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
      let payload: AuthTestStepPayload = {
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

export const addAuthToRequest = (
  authActor: AuthActor,
  gen: GeneratedTestRequest,
  ctx: GenTestContext,
): GeneratedTestRequest => {
  const authConfig = ctx.endpoint.authConfig
  if (!authConfig) {
    return gen
  }
  let env: KeyValType[] = []
  let headers: KeyValType[] = []
  const pre = `${authActor.name}_${authActor.idx}_`
  const authVal = authActor.auth
  if (authConfig.authType == AuthType.BASIC) {
    headers = headers.concat({
      name: "Authorization",
      value: `Basic {{${pre}BASIC_AUTH_CRED}}`,
    })
    env.push({
      name: `${pre}BASIC_AUTH_CRED`,
      value: authVal,
    })
  } else if (authConfig.authType == AuthType.HEADER) {
    headers = headers.concat({
      name: authConfig.headerKey,
      value: `{{${pre}CREDENTIALS}}`,
    })
    env.push({
      name: `${pre}CREDENTIALS`,
      value: authVal,
    })
  } else if (authConfig.authType == AuthType.JWT) {
    headers = headers.concat({
      name: authConfig.headerKey,
      value: `{{${pre}JWT}}`,
    })
    env.push({
      name: `${pre}JWT`,
      value: authVal,
    })
  }
  return {
    ...gen,
    req: {
      ...gen.req,
      headers: (gen.req.headers || []).concat(headers),
    },
    env: gen.env.concat(env),
  }
}

export const authTestStepPayloadToBuilder = (
  endpoint: GenTestEndpoint,
  payload: AuthTestStepPayload,
  idx: number,
): TestStepBuilder => {
  let entityMap: Record<string, any> = {}
  Object.entries(payload.entities).forEach(([name, item]) => {
    Object.entries(item.item).forEach(([itemKey, itemValue]) => {
      entityMap[`${name}.${itemKey}`] = itemValue
    })
  })
  const ctx: GenTestContext = {
    endpoint,
    prefix: `STEP_${idx}`,
    entityMap,
  }
  let gen = makeSampleRequestNoAuth(endpoint, `STEP_${idx}`, ctx)
  gen = addAuthToRequest(payload.authActorEntity, gen, ctx)

  let builder = new TestStepBuilder(gen.req).addToEnv(...gen.env)
  if (payload.authorized) {
    builder = builder.assert({
      type: AssertionType.enum.EQ,
      key: "resp.status",
      value: [200],
    })
  } else {
    builder = builder.assert({
      type: AssertionType.enum.EQ,
      key: "resp.status",
      value: [401, 403],
    })
  }

  return builder
}
