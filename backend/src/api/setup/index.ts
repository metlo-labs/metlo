import { Request, Response } from "express";
import ApiResponseHandler from "api-response-handler";
import { STEP_RESPONSE } from "@common/types";
import { ConnectionType } from "@common/enums";
import { setup } from "aws-services/setup-suricata";
import "express-session";
import { EC2_CONN } from "~/aws-services/create-ec2-instance";
import { VirtualizationType } from "@aws-sdk/client-ec2";

declare module "express-session" {
  interface SessionData {
    connection_config: Record<
      string, // id
      {
        step?: STEP_RESPONSE["step_number"];
        status?: STEP_RESPONSE["status"];
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
    req.session.connection_config[id] = {
      status: "STARTED",
      id,
      type,
      data: {},
    };
  }

  let combined_params = {
    ...req.session.connection_config[id].data,
    ...params,
  };
  let resp = await setup(step, type, combined_params);
  req.session.connection_config[id] = {
    ...req.session.connection_config[id],
    ...resp,
  };

  delete resp.data;

  await ApiResponseHandler.success(res, resp);
};

export const aws_os_choices = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.body;
  const { access_id, secret_access_key } =
    req.session.connection_config[id].data;
  let conn = new EC2_CONN(access_id, secret_access_key);
  let choices = await conn.get_latest_image();
  await ApiResponseHandler.success(res, [
    [choices.Description, choices.ImageId],
  ]);
};

export const aws_instance_choices = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id, specs } = req.body;
  const { access_id, secret_access_key, virtualization_type } =
    req.session.connection_config[id].data;
  let conn = new EC2_CONN(access_id, secret_access_key);
  let choices = await conn.get_valid_types(
    virtualization_type as VirtualizationType,
    specs
  );
  await ApiResponseHandler.success(
    res,
    choices.map((v) => v.InstanceType)
  );
};
