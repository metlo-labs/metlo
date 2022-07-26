import { Request, Response } from "express";
import { TraceParams } from "types";

export const logRequestSingleHandler = async (req: Request, res: Response) => {
  const body: TraceParams = req.body;
  res.send("Received Request")
}