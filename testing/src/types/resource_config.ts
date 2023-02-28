import { z, ZodError } from "zod"

import { PeggySyntaxError } from "../resource-def/test_resource_config"
import { AuthType, RestMethod } from "./enums"

const HostDefSchema = z.object({
  type: z.literal("host"),
  name: z.string(),
  members: z
    .object({
      testingHost: z.string().optional(),
      authType: z.nativeEnum(AuthType).optional(),
      headerKey: z.string().optional(),
      jwtUserPath: z.string().optional(),
      cookieName: z.string().optional(),
    })
    .strict(),
})

const ActorDefSchema = z.object({
  type: z.literal("actor"),
  name: z.string(),
  members: z
    .object({
      items: z.array(z.object({}).passthrough()).optional(),
    })
    .strict(),
})

const ContainsResourceFilterSchema = z.object({
  path: z.string(),
  type: z.string().optional(),
})

const EndpointPermFilterSchema = z
  .object({
    permissions: z.array(z.string()),
    host: z.string().optional(),
    method: z
      .union([z.nativeEnum(RestMethod), z.nativeEnum(RestMethod).array()])
      .optional(),
    path: z.string().optional(),
    contains_resource: ContainsResourceFilterSchema.optional(),
  })
  .strict()

const ResourceDefSchema = z.object({
  type: z.literal("resource"),
  name: z.string(),
  members: z
    .object({
      permissions: z.array(z.string()).optional(),
      items: z.array(z.object({}).passthrough()).optional(),
      endpoints: z.array(EndpointPermFilterSchema).optional(),
    })
    .strict(),
})

const PermissionDefSchema = z.object({
  type: z.literal("permission_def"),
  actor: z.union([
    z.string(),
    z
      .object({
        name: z.string(),
        filters: z.object({}).passthrough(),
      })
      .strict(),
  ]),
  permissions: z.array(z.string()),
  resource: z.union([
    z.string(),
    z
      .object({
        name: z.string(),
        filters: z.object({}).passthrough(),
      })
      .strict(),
  ]),
})

const Comment = z.object({
  type: z.literal("comment"),
  val: z.string(),
})

const TestResourceDeclSchema = z.discriminatedUnion("type", [
  Comment,
  HostDefSchema,
  ActorDefSchema,
  ResourceDefSchema,
  PermissionDefSchema,
])

export const TestResourceConfigSchema = z.array(TestResourceDeclSchema)

export type EndpointPermFilter = z.infer<typeof EndpointPermFilterSchema>
export type HostDef = z.infer<typeof HostDefSchema>
export type ActorDef = z.infer<typeof ActorDefSchema>
export type ResourceDef = z.infer<typeof ResourceDefSchema>
export type PermissionDef = z.infer<typeof PermissionDefSchema>
export type TestResourceConfig = z.infer<typeof TestResourceConfigSchema>
export type ContainsResourceFilter = z.infer<
  typeof ContainsResourceFilterSchema
>

export interface ParseErr {}

export interface ResourceConfigParseRes {
  res?: TestResourceConfig
  zerr?: ZodError
  parseError?: PeggySyntaxError
}

export interface PermissionActor {
  name: string
  filters: Record<string, any>
}

export interface PermissionResource {
  name: string
  filters: Record<string, any>
}

export interface Permission {
  actor: PermissionActor
  permissions: string[]
  resource: PermissionResource
}

export interface Host {
  name: string
  testingHost?: string
  authType?: string
  headerKey?: string
  jwtUserPath?: string
  cookieName?: string
}

export interface Resource {
  type: "resource"
  name: string
  permissions: string[]
  items: any[]
  endpoints: EndpointPermFilter[]
}

export interface Actor {
  type: "actor"
  name: string
  items: any[]
}

export interface TemplateConfig {
  hosts: Record<string, Host>
  actors: Record<string, Actor>
  resources: Record<string, Resource>
  permissions: Permission[]
}
