import { Request, Response } from "express";
import ApiResponseHandler from "api-response-handler";
import { STEP_RESPONSE } from "@common/types";
import { ConnectionType } from "@common/enums";
import "express-session";

declare module "express-session" {
  interface SessionData {
    connection_config: Record<
      string, // id
      {
        step?: number;
        status?: string;
        id?: string;
        type?: ConnectionType;
        data?: STEP_RESPONSE["data"];
      }
    >;
  }
}

export const setup_connection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { step, id, status, type, params } = req.body;
  if (!req.session.connection_config) {
    req.session.connection_config = {};
  }
  if (!req.session.connection_config[id]) {
    req.session.connection_config[id] = {};
  }
  req.session.connection_config[id].step = step;
  req.session.connection_config[id].id = id;
  req.session.connection_config[id].status = status;
  req.session.connection_config[id].type = type;
  req.session.connection_config[id].data = {
    ...req.session.connection_config[id].data,
    ...params,
  };
  await ApiResponseHandler.success(res, {
    success: "OK",
    step_number: 1,
    last_completed: 1,
    message: "",
    keep: req.session.connection_config[id],
  });
};
