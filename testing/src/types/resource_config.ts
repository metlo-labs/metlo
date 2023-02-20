import { z, ZodError } from "zod"

import { PeggySyntaxError } from "../resource-def/test_resource_config"
import { AuthType, Method } from "./enums"

export const HostDef = z.object({
  type: z.literal("host"),
  name: z.string(),
  members: z
    .object({
      testingHost: z.string(),
      authType: z.nativeEnum(AuthType),
      headerKey: z.string().optional(),
      jwtUserPath: z.string().optional(),
      cookieName: z.string().optional(),
    })
    .strict(),
})

export const ActorDef = z.object({
  type: z.literal("actor"),
  name: z.string(),
  members: z
    .object({
      items: z.array(z.object({})).optional(),
    })
    .strict(),
})

export const EndpointPermFilter = z
  .object({
    permissions: z.array(z.string()),
    host: z.string().optional(),
    method: z.nativeEnum(Method).optional(),
    path: z.string().optional(),
    contains_resource: z
      .object({
        path: z.string(),
        type: z.string().optional(),
      })
      .optional(),
  })
  .strict()

export const ResourceDef = z.object({
  type: z.literal("resource"),
  name: z.string(),
  members: z
    .object({
      permissions: z.array(z.string()).optional(),
      items: z.array(z.object({})).optional(),
      endpoints: z.array(EndpointPermFilter).optional(),
    })
    .strict(),
})

export const PermissionDef = z.object({
  type: z.literal("permission_def"),
  actor: z.union([
    z.string(),
    z
      .object({
        name: z.string(),
        filters: z.object({}),
      })
      .strict(),
  ]),
  permissions: z.array(z.string()),
  resource: z.union([
    z.string(),
    z
      .object({
        name: z.string(),
        filters: z.object({}),
      })
      .strict(),
  ]),
})

export const Comment = z.object({
  type: z.literal("comment"),
  val: z.string(),
})

export const TestResourceDecl = z.discriminatedUnion("type", [
  Comment,
  HostDef,
  ActorDef,
  ResourceDef,
  PermissionDef,
])

export const TestResourceConfigSchema = z.array(TestResourceDecl)

export type TestResourceConfig = z.infer<typeof TestResourceConfigSchema>

export interface ParseErr {}

export interface ResourceConfigParseRes {
  res?: TestResourceConfig
  zerr?: ZodError
  parseError?: PeggySyntaxError
}
