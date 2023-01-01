import { z } from "zod"

import { AlertType, RiskScore, Status } from "../enums"

export const GetAlertParamsSchema = z.object({
  uuid: z.string().uuid().optional(),
  apiEndpointUuid: z.string().uuid().optional(),
  riskScores: z.nativeEnum(RiskScore).array().optional(),
  status: z.nativeEnum(Status).array().optional(),
  alertTypes: z.nativeEnum(AlertType).array().optional(),
  hosts: z.string().array().optional(),
  offset: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  order: z.union([z.literal("DESC"), z.literal("ASC")]).optional(),
})

export type GetAlertParams = z.infer<typeof GetAlertParamsSchema>
