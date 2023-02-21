import {
  Actor,
  ContainsResourceFilter,
  EndpointPermFilter,
  Permission,
  Resource,
  TemplateConfig,
} from "../types/resource_config"
import { GenTestEndpoint } from "./types"

export interface ResourceEntityKey {
  type: "actor" | "resource"
  name: string
  path: string
}

export type ResourcePerms = Record<string, string[]>

const getAllEntities = (config: TemplateConfig): ResourceEntityKey[] => {
  let resourceEntityKeys: ResourceEntityKey[] = []
  const confActors = Object.values(config.actors)
  const confResources = Object.values(config.resources)
  const entities = (confActors as (Actor | Resource)[]).concat(confResources)
  for (const e of entities) {
    if (e.items.length > 0) {
      resourceEntityKeys = resourceEntityKeys.concat(
        Object.keys(e.items[0]).map(k => ({
          type: e.type,
          name: e.name,
          path: k,
        })),
      )
    }
  }
  return resourceEntityKeys
}

export const getEndpointRequestEntities = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): ResourceEntityKey[] => {
  const validEntities = getAllEntities(config)
  const pathToEntity = Object.fromEntries(
    validEntities.map(e => [`${e.name}.${e.path}`, e]),
  )
  return endpoint.dataFields
    .filter(e => e.dataSection.startsWith("req") && e.entity)
    .map(e => e.entity as string)
    .map(e => pathToEntity[e])
    .filter(e => e)
}

export const getEndpointEntities = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): ResourceEntityKey[] => {
  const validEntities = getAllEntities(config)
  const pathToEntity = Object.fromEntries(
    validEntities.map(e => [`${e.name}.${e.path}`, e]),
  )
  return endpoint.dataFields
    .filter(e => e.entity)
    .map(e => e.entity as string)
    .map(e => pathToEntity[e])
    .filter(e => e)
}

const validateEndpointFilter = (
  endpoint: GenTestEndpoint,
  permFilter: EndpointPermFilter,
  endpointEntities: ResourceEntityKey[],
  defaultResource: string,
): boolean => {
  if (permFilter.method && permFilter.method != endpoint.method) {
    return false
  }
  if (permFilter.host && !endpoint.host.match(new RegExp(permFilter.host))) {
    return false
  }
  if (permFilter.path && !endpoint.path.match(new RegExp(permFilter.path))) {
    return false
  }
  if (permFilter.contains_resource) {
    const contains_resource =
      permFilter.contains_resource as ContainsResourceFilter
    if (
      contains_resource.type &&
      !endpointEntities.find(
        e =>
          e.type == contains_resource.type &&
          e.path.startsWith(contains_resource.path),
      )
    ) {
      return false
    } else if (
      !endpointEntities.find(
        e =>
          e.type == defaultResource &&
          e.path.startsWith(contains_resource.path),
      )
    ) {
      return false
    }
  }
  return true
}

export const getEndpointPermissions = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): Record<string, string[]> => {
  let out: Record<string, string[]> = {}
  const resources = Object.values(config.resources)
  const endpointEntities = getEndpointEntities(endpoint, config)
  resources.forEach(resource => {
    const permFilters = resource.endpoints
    const endpointPerms = new Set(
      permFilters
        .filter(e =>
          validateEndpointFilter(endpoint, e, endpointEntities, resource.name),
        )
        .map(e => e.permissions)
        .flat(),
    )
    if (endpointPerms.size > 0) {
      out[resource.name] = out[resource.name]
        ? out[resource.name].concat([...endpointPerms])
        : [...endpointPerms]
    }
  })
  return out
}

export interface AuthActor {
  name: string
  auth: string
  item: any
}

export const getAllAuthActors = (config: TemplateConfig): AuthActor[] => {
  return Object.entries(config.actors)
    .filter(([k, v]) => v.items.length > 0 && v.items[0].auth)
    .map(([k, v]) => v.items.map(e => ({ name: k, auth: e.auth, item: e })))
    .flat()
}

export const getEntityItems = (
  entName: string,
  config: TemplateConfig,
): any[] => {
  if (config.actors[entName]) {
    return config.actors[entName].items
  }
  if (config.resources[entName]) {
    return config.resources[entName].items
  }
  return []
}

export const getActorEntPerms = (
  authActor: AuthActor,
  entName: string,
  permsNeeded: string[],
  config: TemplateConfig,
): Permission[] => {
  let out: Permission[] = []
  for (const permDef of config.permissions) {
    const permsSet = new Set(permDef.permissions)
    if (!permsNeeded.every(e => permsSet.has(e))) {
      continue
    }
    if (permDef.actor.name != authActor.name) {
      continue
    }
    let foundBadFilter = false
    for (const [k, v] of Object.entries(permDef.actor.filters)) {
      if (authActor.item[k] != v) {
        foundBadFilter = true
        break
      }
    }
    if (foundBadFilter) {
      continue
    }
    if (permDef.resource.name != entName) {
      continue
    }
    out.push(permDef)
  }
  return out.sort(
    (a, b) =>
      Object.keys(a.actor.filters).length +
      Object.keys(a.resource.filters).length -
      (Object.keys(b.actor.filters).length +
        Object.keys(b.resource.filters).length),
  )
}

interface ResourceItem {
  name: string
  item: any
}

interface PermssionValidRet {
  valid: boolean
  reason: string
}

export const permissionValid = (
  permission: Permission,
  authActor: AuthActor,
  resourceItem: ResourceItem,
): PermssionValidRet => {
  if (permission.actor.name != authActor.name) {
    throw Error(
      `Invalid actor (${JSON.stringify(
        authActor,
      )}) for permission (${JSON.stringify(permission)})`,
    )
  }
  if (permission.resource.name != resourceItem.name) {
    throw Error(
      `Invalid resource (${JSON.stringify(
        resourceItem,
      )}) for permission (${JSON.stringify(permission)})`,
    )
  }
  for (const [k, v] of Object.entries(permission.actor.filters)) {
    if (authActor.item[k] != v) {
      throw Error(
        `Invalid actor (${JSON.stringify(
          authActor,
        )}) for permission (${JSON.stringify(permission)})`,
      )
    }
  }
  for (const [k, v] of Object.entries(permission.resource.filters)) {
    if (resourceItem.item[k] != v) {
      return {
        valid: false,
        reason: `${resourceItem.name}.${k} = ${resourceItem.item[k]}`,
      }
    }
  }
  return {
    valid: true,
    reason: `Actor has permissions for resource with permission: ${JSON.stringify(
      permission,
    )}`,
  }
}

interface AccessItem {
  item: any
  reason: string
}

export interface AccessItems {
  hasAccess: Record<string, AccessItem[]>
  notHasAccess: Record<string, AccessItem[]>
  resourceLevelAccess: Record<string, boolean>
}

export const getAccessItems = (
  authActor: AuthActor,
  resourceToPerms: Record<string, string[]>,
  config: TemplateConfig,
): AccessItems => {
  let out: AccessItems = {
    hasAccess: {},
    notHasAccess: {},
    resourceLevelAccess: {},
  }
  const reqEntNames = Object.keys(resourceToPerms)
  for (const entName of reqEntNames) {
    const allEntityItems = getEntityItems(entName, config)
    const permsNeeded = resourceToPerms[entName] || []
    if (permsNeeded.length == 0) {
      out.hasAccess[entName] = allEntityItems.map(e => ({
        item: e,
        reason: "No permissions required for this endpoint",
      }))
      continue
    }
    const actorEntPerms = getActorEntPerms(
      authActor,
      entName,
      permsNeeded,
      config,
    )
    if (
      allEntityItems.length == 0 &&
      actorEntPerms &&
      actorEntPerms.find(e => Object.keys(e.resource.filters).length == 0)
    ) {
      out.resourceLevelAccess[entName] = true
      continue
    }
    if (allEntityItems.length == 0) {
      out.resourceLevelAccess[entName] = false
      continue
    }
    let hasAccessItems: AccessItem[] = []
    let notHasAccessItems: AccessItem[] = []
    for (const entItem of allEntityItems) {
      const permissionValidations = actorEntPerms.map(perms =>
        permissionValid(perms, authActor, { name: entName, item: entItem }),
      )
      const valid = permissionValidations.find(e => e.valid)
      if (valid) {
        hasAccessItems.push({ item: entItem, reason: valid.reason })
      } else {
        notHasAccessItems.push({
          item: entItem,
          reason: `Actor does not have ${permsNeeded} access to ${permissionValidations
            .map(e => e.reason)
            .join(" or ")}.`,
        })
      }
    }
    out.hasAccess[entName] = hasAccessItems
    out.notHasAccess[entName] = notHasAccessItems
  }
  return out
}
