import { Request, Response } from "express";
import { GetEndpointsService } from "../../services/get-endpoints";
import { GetEndpointParams } from "../../types";

export const getEndpointsHandler = async (req: Request, res: Response) => {
  const getEndpointParams: GetEndpointParams = req.query;
  try {
    const endpoints = await GetEndpointsService.getEndpoints(getEndpointParams);
    res.status(200).send(endpoints);
  } catch {
    res.sendStatus(500);
  }
};

export const getEndpointHandler = async (req: Request, res: Response) => {
  const { endpointId } = req.params;
  try {
    const endpoint = await GetEndpointsService.getEndpoint(endpointId);
    res.status(200).send(endpoint);
  } catch {
    res.sendStatus(500);
  }
};
