import { z } from "zod"

export interface ZodError {
  type: "ZOD"
  err: z.ZodError
  message: string
}

export type MetloAPIErr = string | ZodError

export const formatMetloAPIErr = (e: MetloAPIErr) => {
  if (typeof e == "string") {
    return e
  }
  return e?.message
}
