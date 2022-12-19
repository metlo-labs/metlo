import validator from "validator"
import { GenerateTestParams, GenerateTestRes } from "@common/types"
import { GENERATED_TEST_TYPE } from "@common/enums"
import { MetloContext } from "types"
import { generateBrokenAuthTest } from "./broken-auth"
import { AppDataSource } from "data-source"
import { getEntityManager } from "services/database/utils"
import { ApiEndpoint } from "models"

export const generateTest = async (
  ctx: MetloContext,
  { type, host, endpoint }: GenerateTestParams,
): Promise<GenerateTestRes> => {
  let endpointObj: ApiEndpoint = null
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    if (validator.isUUID(endpoint)) {
      endpointObj = await getEntityManager(ctx, queryRunner).findOneBy(
        ApiEndpoint,
        { uuid: endpoint },
      )
    } else {
      endpointObj = await getEntityManager(ctx, queryRunner).findOneBy(
        ApiEndpoint,
        { path: endpoint, host: host },
      )
    }
  } catch (err) {
    return {
      success: false,
      msg: `INTERNAL ERROR: ${err.message}`,
    }
  } finally {
    await queryRunner.release()
  }
  if (!endpointObj) {
    return {
      success: false,
      msg: `Couldn't find endpoint - Endpoint: ${endpoint} Host: ${host}`,
    }
  }
  if (type == GENERATED_TEST_TYPE.BROKEN_AUTHENTICATION) {
    return generateBrokenAuthTest(ctx, endpointObj)
  }
  return {
    success: false,
    msg: `INVALID TEST TYPE: ${type}`,
  }
}
