import { z } from "zod"

export const UpdateTestingConfigParamsSchema = z.object({
  configString: z.string(),
})

export type UpdateTestingConfigParams = z.infer<
  typeof UpdateTestingConfigParamsSchema
>
