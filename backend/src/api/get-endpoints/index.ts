import { Request, Response } from "express";
import { GetEndpointsService } from "../../services/get-endpoints";
import { GetEndpointParams } from "../../types";

export const getEndpointsHandler = async (req: Request, res: Response) => {
  const getEndpointParams: GetEndpointParams = req.query;
  try {
    const endpoints = await GetEndpointsService.getEndpoints(getEndpointParams);
    res.send(200).send(endpoints)
  } catch {
    res.sendStatus(500)
  }
}
