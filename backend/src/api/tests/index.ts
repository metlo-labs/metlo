import { Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { runTest } from "@metlo/testing"
import { ApiEndpointTest } from "models"
import { GetEndpointsService } from "services/get-endpoints"
import { getRepoQB } from "services/database/utils"
import { MetloRequest } from "types"

export const runTestHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { test, endpointUuid } = req.body
    const endpoint = await GetEndpointsService.getEndpoint(
      req.ctx,
      endpointUuid,
    )
    let envVars = new Map<string, string>()
    envVars.set("baseUrl", `https://${endpoint.host}`)
    const testRes = await runTest(test, envVars)
    await ApiResponseHandler.success(res, testRes)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const saveTest = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const {
    test: { uuid, name, tags, requests },
    endpointUuid,
  } = req.body
  let testInsert = await getRepoQB(req.ctx, ApiEndpointTest)
    .insert()
    .into(ApiEndpointTest)
    .values({
      uuid: uuid,
      name,
      tags,
      requests,
      apiEndpoint: {
        uuid: endpointUuid,
      },
    })
    .orUpdate(["name", "tags", "requests"], ["uuid"])
    .execute()
  let resp = await getRepoQB(req.ctx, ApiEndpointTest)
    .select()
    .where("uuid = :uuid", testInsert.identifiers[0])
    .getOne()
  await ApiResponseHandler.success(res, resp)
}

export const getTest = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { uuid } = req.params
  try {
    let resp = await getRepoQB(req.ctx, ApiEndpointTest)
      .select()
      .where("uuid = :uuid", { uuid })
      .getOne()
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const listTests = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { hostname } = req.query
  var resp: ApiEndpointTest[]
  try {
    let partial_resp = getRepoQB(req.ctx, ApiEndpointTest, "test")
      .select()
      .leftJoinAndSelect("test.apiEndpoint", "endpoint")
    if (hostname) {
      resp = await partial_resp
        .where("endpoint.host = :hostname", { hostname })
        .getMany()
    } else {
      resp = await partial_resp.getMany()
    }

    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteTest = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { uuid } = req.params

  try {
    let resp = await getRepoQB(req.ctx, ApiEndpointTest)
      .delete()
      .from(ApiEndpointTest)
      .where("uuid = :uuid", { uuid })
      .execute()

    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
