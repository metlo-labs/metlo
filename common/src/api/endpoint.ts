import { z } from "zod"

import {
  DataSection,
  HostSortOptions,
  HostType,
  RestMethod,
  RiskScore,
  SortOrder,
  NewDetectionType,
} from "../enums"

export const GetEndpointParamsSchema = z.object({
  hosts: z.string().array().optional(),
  riskScores: z.nativeEnum(RiskScore).array().optional(),
  methods: z.nativeEnum(RestMethod).array().optional(),
  dataClasses: z.string().array().optional(),
  resourcePermissions: z.string().array().optional(),
  searchQuery: z.string().optional(),
  isAuthenticated: z.string().optional(),
  hostType: z.nativeEnum(HostType).optional().default(HostType.ANY),
  offset: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
})

export const GetNewDetectionsParamsSchema = z.object({
  start: z.string().nullable().optional(),
  end: z.string().nullable().optional(),
  detectionRiskScores: z.nativeEnum(RiskScore).array().default([]),
  detectionHosts: z.string().array().default([]),
  detectionType: z
    .nativeEnum(NewDetectionType)
    .default(NewDetectionType.ENDPOINT),
  detectionOffset: z.preprocess(
    a => parseInt((a || "0") as string),
    z.number(),
  ),
  detectionLimit: z.preprocess(
    a => parseInt((a || "10") as string),
    z.number().max(50),
  ),
})

export type GetNewDetectionsParams = z.infer<
  typeof GetNewDetectionsParamsSchema
>

export type GetEndpointParams = z.infer<typeof GetEndpointParamsSchema>

export const DeleteEndpointsParamsSchema = z.object({
  uuids: z.string().array(),
})

export type DeleteEndpointParams = z.infer<typeof DeleteEndpointsParamsSchema>

export const UpdateDataFieldClassesParamsSchema = z.object({
  dataClasses: z.string().array(),
  dataSection: z.nativeEnum(DataSection),
  dataPath: z.string(),
})

export type UpdateDataFieldClassesParams = z.infer<
  typeof UpdateDataFieldClassesParamsSchema
>

export const GetHostParamsSchema = z.object({
  searchQuery: z.string().optional(),
  hostType: z.nativeEnum(HostType).optional().default(HostType.ANY),
  offset: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  sortBy: z.nativeEnum(HostSortOptions).default(HostSortOptions.NUM_ENDPOINTS),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC),
})
export type GetHostParams = z.infer<typeof GetHostParamsSchema>

export const DeleteHostsParamsSchema = z.object({
  hosts: z.string().array(),
})
export type DeleteHostBatchParams = z.infer<typeof DeleteHostsParamsSchema>

export const UpdateFullTraceCaptureEnabledSchema = z.object({
  enabled: z.boolean(),
})
export type UpdateFullTraceCaptureEnabledParams = z.infer<
  typeof UpdateFullTraceCaptureEnabledSchema
>

export const UpdateDataFieldEntitySchema = z.object({
  entity: z.string().nullable(),
})
export type UpdateDataFieldEntityParams = z.infer<
  typeof UpdateDataFieldEntitySchema
>

export const UpdateDataFieldPathSchema = z.object({
  dataPath: z.string(),
})
export type UpdateDataFieldPathParams = z.infer<
  typeof UpdateDataFieldPathSchema
>

export interface NewDetectionsAggRes {
  day: string
  numEndpoints: number
  numFields: number
}
