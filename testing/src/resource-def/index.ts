import { parse, PeggySyntaxError } from "../resource-def/test_resource_config"
import {
  ResourceConfigParseRes,
  TemplateConfig,
  TestResourceConfig,
  TestResourceConfigSchema,
} from "../types/resource_config"

export const parseResourceConfig = (input: string): ResourceConfigParseRes => {
  try {
    const parsed = parse(input)
    const data = TestResourceConfigSchema.safeParse(parsed)
    if (data.success == false) {
      return {
        zerr: data.error,
      }
    }
    return {
      res: data.data,
    }
  } catch (err) {
    return {
      parseError: err as PeggySyntaxError,
    }
  }
}

export const processResourceConfig = (
  conf: TestResourceConfig,
): TemplateConfig => {
  let out: TemplateConfig = {
    hosts: {},
    actors: {},
    resources: {},
    permissions: [],
  }
  for (const item of conf) {
    if (item.type == "host") {
      out.hosts[item.name] = {
        name: item.name,
        testingHost: item.members.testingHost,
        authType: item.members.authType,
        headerKey: item.members.headerKey,
        jwtUserPath: item.members.jwtUserPath,
        cookieName: item.members.cookieName,
      }
    } else if (item.type == "actor") {
      out.actors[item.name] = {
        type: "actor",
        name: item.name,
        items: item.members.items || [],
      }
    } else if (item.type == "resource") {
      out.resources[item.name] = {
        type: "resource",
        name: item.name,
        permissions: item.members.permissions || [],
        items: item.members.items || [],
        endpoints: item.members.endpoints || [],
        graphql: item.members.graphql || [],
      }
    } else if (item.type == "permission_def") {
      out.permissions.push({
        actor:
          typeof item.actor == "string"
            ? {
                name: item.actor,
                filters: {},
              }
            : item.actor,
        permissions: item.permissions,
        resource:
          typeof item.resource == "string"
            ? {
                name: item.resource,
                filters: {},
              }
            : item.resource,
      })
    }
  }
  return out
}
