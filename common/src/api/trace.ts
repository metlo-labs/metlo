import { z } from "zod"

export const GetTracesParams = z.object({
  method: z.string().optional(),
  pathRegex: z.string().optional(),
  hostRegex: z.string().optional(),
  offset: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  limit: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
})