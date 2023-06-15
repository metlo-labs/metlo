import { DataSection } from "./enums"
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

interface ContainsResourceFilterKey {
  type: "actor" | "resource"
  name: string
  path: string
  dataPath: string
  dataSection: DataSection
}

export type ResourcePerms = Record<string, string[]>

const DATA_SECTION_TO_PATH: Record<DataSection, string> = {
  [DataSection.REQUEST_PATH]: "req.path",
  [DataSection.REQUEST_QUERY]: "req.query",
  [DataSection.REQUEST_HEADER]: "req.header",
  [DataSection.REQUEST_BODY]: "req.body",
  [DataSection.RESPONSE_HEADER]: "res.header",
  [DataSection.RESPONSE_BODY]: "res.body",
}

const getAllEntities = (config: TemplateConfig): ResourceEntityKey[] => {
  let resourceEntityKeys: ResourceEntityKey[] = []
  const confActors = Object.values(config.actors ?? {})
  const confResources = Object.values(config.resources ?? {})
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

export const getEntityMap = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): Record<string, any> => {
  const endpointReqEnts = getEndpointRequestEntities(endpoint, config)
  const entityMap: Record<string, any> = {}
  for (const reqEnt of endpointReqEnts) {
    const entityItems = getEntityItems(reqEnt.name, config)
    if (entityItems.length > 0) {
      Object.entries(entityItems[0]).forEach(([itemKey, itemValue]) => {
        entityMap[`${reqEnt.name}.${itemKey}`] = itemValue
      })
    }
  }
  return entityMap
}

export const getEndpointEntities = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
): ContainsResourceFilterKey[] => {
  const validEntities = getAllEntities(config)
  const pathToEntity = Object.fromEntries(
    validEntities.map(e => [`${e.name}.${e.path}`, e]),
  )
  return endpoint.dataFields
    .filter(e => e.entity)
    .map(e => ({
      entity: e.entity as string,
      dataPath: e.dataPath,
      dataSection: e.dataSection,
    }))
    .map(e => ({
      ...pathToEntity[e.entity],
      dataPath: e.dataPath,
      dataSection: e.dataSection,
    }))
    .filter(e => e.name)
}

const checkContainsResource = (
  containsResource: ContainsResourceFilter,
  defaultResource: string,
  filters: ContainsResourceFilterKey[],
) => {
  return filters.some(
    e =>
      ((containsResource.type && e.name === containsResource.type) ||
        (!containsResource.type && e.name === defaultResource)) &&
      `${DATA_SECTION_TO_PATH[e.dataSection]}${
        e.dataPath ? `.${e.dataPath}` : ""
      }`.startsWith(containsResource.path || ""),
  )
}

const validateEndpointFilter = (
  endpoint: GenTestEndpoint,
  permFilter: EndpointPermFilter,
  endpointEntities: ContainsResourceFilterKey[],
  defaultResource: string,
): boolean => {
  if (permFilter.method) {
    if (typeof permFilter.method == "string") {
      if (permFilter.method != endpoint.method) {
        return false
      }
    } else {
      if (!permFilter.method.includes(endpoint.method)) {
        return false
      }
    }
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
      !checkContainsResource(
        contains_resource,
        defaultResource,
        endpointEntities,
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
  idx: number
  auth: string
  item: any
}

export const getAllAuthActors = (config: TemplateConfig): AuthActor[] => {
  return Object.entries(config.actors)
    .filter(([k, v]) => v.items.length > 0 && v.items[0].auth)
    .map(([k, v]) =>
      v.items.map((e, i) => ({ name: k, auth: e.auth, item: e, idx: i + 1 })),
    )
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
        reason: `${k}=${resourceItem.item[k]}`,
      }
    }
  }
  let reasonItems = ""
  if (typeof resourceItem.item === "object") {
    const entries = Object.entries(resourceItem.item)
    entries.forEach(([itemKey, itemValue], idx) => {
      reasonItems += `${itemKey}=${itemValue}`
      if (idx < entries.length - 1) {
        reasonItems += ","
      }
    })
  }
  return {
    valid: true,
    reason: `${authActor.name}(${Object.entries(authActor.item)
      .filter(([k, v]) => k !== "auth")
      .map(([k, v]) => `${k}=${v}`)
      .join(",")}) has ${permission.permissions} access to ${
      resourceItem.name
    }${reasonItems ? `(${reasonItems})` : ""}.`,
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
        reason: "No permissions required for this endpoint.",
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
        hasAccessItems.push({ item: entItem, reason: valid?.reason })
      } else {
        notHasAccessItems.push({
          item: entItem,
          reason: `${authActor.name}(${Object.entries(authActor.item)
            .filter(([k, v]) => k !== "auth")
            .map(([k, v]) => `${k}=${v}`)
            .join(",")}) does not have ${permsNeeded} access to ${
            typeof entItem === "object"
              ? `${entName}(${Object.entries(entItem)
                  .map(([itemKey, itemValue], idx) => `${itemKey}=${itemValue}`)
                  .join(",")})`
              : entName
          }.`,
        })
      }
    }
    out.hasAccess[entName] = hasAccessItems
    out.notHasAccess[entName] = notHasAccessItems
  }
  return out
}

export const findEndpointResourcePermissions = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
) => {
  const resources = Object.keys(config.resources)
  if (resources.length === 0) {
    return []
  }

  const resourcePermissions = new Set<string>()
  const endpointEntities = getEndpointEntities(endpoint, config)

  for (const resource of resources) {
    const permFilters = config.resources[resource]?.endpoints ?? []
    if (permFilters.length > 0) {
      for (const permFilter of permFilters) {
        if (
          !validateEndpointFilter(
            endpoint,
            permFilter,
            endpointEntities,
            resource,
          )
        ) {
          continue
        }
        permFilter.permissions.forEach(perm => {
          resourcePermissions.add(`${resource}.${perm}`)
        })
      }
    }
  }
  return [...resourcePermissions]
}
