import { Request, Response } from "express";
import ApiResponseHandler from "api-response-handler";
import { runTest } from "~/services/testing/runTests";

export const runTestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);
  runTest(req.body.test);
  await ApiResponseHandler.success(res, null);
};
