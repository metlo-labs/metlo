import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { runTest } from "services/testing/runTests"
import { AppDataSource } from "data-source"
import { ApiEndpointTest } from "models"

export const runTestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const testRes = await runTest(req.body.test)
    await ApiResponseHandler.success(res, testRes)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const saveTest = async (req: Request, res: Response): Promise<void> => {
  const {
    test: { uuid, name, tags, requests },
    endpointUuid,
  } = req.body
  let resp = await AppDataSource.getRepository(ApiEndpointTest)
    .createQueryBuilder()
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

  await ApiResponseHandler.success(res, resp)
}

export const listTests = async (req: Request, res: Response): Promise<void> => {
  const { uuid } = req.params

  let resp = await AppDataSource.getRepository(ApiEndpointTest)
    .createQueryBuilder("test")
    .select()
    .leftJoinAndSelect("test.apiEndpoint", "apiEndpoint")
    .getMany()

  await ApiResponseHandler.success(res, resp)
}

export const getTest = async (req: Request, res: Response): Promise<void> => {
  const { uuid } = req.params
  try {
    let resp = await AppDataSource.getRepository(ApiEndpointTest)
      .createQueryBuilder()
      .select()
      .where("uuid = :uuid", { uuid })
      .getOne()
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
