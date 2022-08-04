import { Request, Response } from "express";
import { GetEndpointsService } from "../../services/get-endpoints";
import { GetEndpointParams } from "../../types";
import ApiResponseHandler from "../../api-response-handler";

export const getEndpointsHandler = async (req: Request, res: Response) => {
  const getEndpointParams: GetEndpointParams = req.query;
  try {
    const endpoints = await GetEndpointsService.getEndpoints(getEndpointParams);
    await ApiResponseHandler.success(res, endpoints);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export const getEndpointHandler = async (req: Request, res: Response) => {
  const { endpointId } = req.params;
  try {
    const endpoint = await GetEndpointsService.getEndpoint(endpointId);
    await ApiResponseHandler.success(res, endpoint);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
