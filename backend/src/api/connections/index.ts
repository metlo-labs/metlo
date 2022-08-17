import { Request, Response } from "express";
import {
  list_connections as list_connections_service,
  get_connection_for_uuid as get_connection_for_uuid_service,
} from "services/connections";
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

const get_connection_for_uuid = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const connection = await get_connection_for_uuid_service(uuid);

    delete connection.aws.keypair;
    delete connection.aws.access_id;
    delete connection.aws.secret_access_key;

    await ApiResponseHandler.success(res, connection);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export { list_connections, get_connection_for_uuid };
