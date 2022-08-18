import { Request, Response } from "express";
import ApiResponseHandler from "api-response-handler";
import { runTest } from "~/services/testing/runTests";
import { AppDataSource } from "~/data-source";
import { ApiEndpointTest } from "~/models";

export const runTestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);
  runTest(req.body.test);
  await ApiResponseHandler.success(res, null);
};

export const saveTest = async (req: Request, res: Response): Promise<void> => {
  const {
    test: { uuid, name, tags, requests },
    endpointUuid,
  } = req.body;
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
    .execute();

  await ApiResponseHandler.success(res, resp);
};
