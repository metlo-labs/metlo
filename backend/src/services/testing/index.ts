import validator from "validator"
import { GenerateTestParams, GenerateTestRes } from "@common/types"
import { GENERATED_TEST_TYPE } from "@common/enums"
import { MetloContext } from "types"
import { generateBrokenAuthTest } from "./broken-auth"
import { getRepository } from "services/database/utils"
import { ApiEndpoint } from "models"

export const generateTest = async (
  ctx: MetloContext,
  { type, host, endpoint }: GenerateTestParams,
): Promise<GenerateTestRes> => {
  let endpointObj: ApiEndpoint | null = null
  const apiEndpointRepository = getRepository(ctx, ApiEndpoint)
  if (validator.isUUID(endpoint)) {
    endpointObj = await apiEndpointRepository.findOne({
      where: { uuid: endpoint },
      relations: { dataFields: true },
    })
  } else {
    endpointObj = await apiEndpointRepository.findOne({
      where: { path: endpoint, host: host },
      relations: { dataFields: true },
    })
  }
  if (!endpointObj) {
    return {
      success: false,
      msg: `Couldn't find endpoint - Endpoint: ${endpoint} Host: ${host}`,
    }
  }
  if (type == GENERATED_TEST_TYPE.BROKEN_AUTHENTICATION) {
    return await generateBrokenAuthTest(ctx, endpointObj)
  }
  return {
    success: false,
    msg: `INVALID TEST TYPE: ${type}`,
  }
}
