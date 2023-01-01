import { z } from "zod"

import { DataSection, RiskScore } from "../enums"

export const GetEndpointParamsSchema = z.object({
  hosts: z.string().array().optional(),
  riskScores: z.nativeEnum(RiskScore).array().optional(),
  dataClasses: z.string().array().optional(),
  searchQuery: z.string().optional(),
  isAuthenticated: z.boolean().optional(),
  offset: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
})

export type GetEndpointParams = z.infer<typeof GetEndpointParamsSchema>

export const UpdateDataFieldClassesParamsSchema = z.object({
  dataClasses: z.string().array(),
  dataSection: z.nativeEnum(DataSection),
  dataPath: z.string(),
})

export type UpdateDataFieldClassesParams = z.infer<
  typeof UpdateDataFieldClassesParamsSchema
>
