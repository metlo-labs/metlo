import { z } from "zod"

import { AlertType } from "../enums"

export const CreateWebhookParamsSchema = z.object({
  url: z.string().url(),
  alertTypes: z.nativeEnum(AlertType).array(),
  hosts: z.string().array(),
})
export type CreateWebhookParams = z.infer<typeof CreateWebhookParamsSchema>
