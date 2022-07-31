import { Request, Response } from "express";
import { LogRequestService } from "../../services/log-request";
import { TraceParams } from "../../types";

export const logRequestSingleHandler = async (req: Request, res: Response) => {
  const traceParams: TraceParams = req.body;
  try {
    await LogRequestService.logRequest(traceParams);
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
};

export const logRequestBatchHandler = async (req: Request, res: Response) => {
  const traceParamsBatch: TraceParams[] = req.body;
  try {
    await LogRequestService.logRequestBatch(traceParamsBatch);
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
};
