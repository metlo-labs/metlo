import { GenerateTestRes } from "@common/types"
import { ApiEndpoint } from "models"
import { MetloContext } from "types"

export const generateBrokenAuthTest = (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
): GenerateTestRes => {
  return {
    success: false,
    msg: "asdf",
  }
}
