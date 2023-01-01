import { z } from "zod"

import { DataSection, RiskScore } from "../enums"

export const GetSensitiveDataAggParamsSchema = z.object({
  hosts: z.string().array().optional(),
  riskScores: z.nativeEnum(RiskScore).array().optional(),
  locations: z.nativeEnum(DataSection).array().optional(),
})
export type GetSensitiveDataAggParams = z.infer<
  typeof GetSensitiveDataAggParamsSchema
>

export const GetVulnerabilityAggParamsSchema = z.object({
  hosts: z.string().array().optional(),
  riskScores: z.nativeEnum(RiskScore).array().optional(),
})
export type GetVulnerabilityAggParams = z.infer<
  typeof GetVulnerabilityAggParamsSchema
>
