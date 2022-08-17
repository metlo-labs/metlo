import { Request, Response } from "express";
import { list_connections as list_connections_service } from "services/connections";
import ApiResponseHandler from "~/api-response-handler";

const list_connections = async (req: Request, res: Response) => {
  try {
    const connections = (await list_connections_service()).map((v) => {
      delete v.aws.keypair;
      delete v.aws.access_id;
      delete v.aws.secret_access_key;
      return v;
    });

    await ApiResponseHandler.success(res, connections);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export { list_connections };
