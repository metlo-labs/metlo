import { Request, Response } from "express"
import {
  list_connections as list_connections_service,
  get_connection_for_uuid as get_connection_for_uuid_service,
  update_connection_for_uuid as update_connection_for_uuid_service,
  delete_connection_for_uuid,
} from "services/connections";
import ApiResponseHandler from "api-response-handler";
import { decrypt } from "utils/encryption";
import { delete_connection as delete_connection_request } from "suricata_setup/";

const list_connections = async (req: Request, res: Response) => {
  try {
    const connections = (await list_connections_service()).map(v => {
      delete v.aws.keypair
      delete v.aws.access_id
      delete v.aws.secret_access_key
      return v
    })

    await ApiResponseHandler.success(res, connections)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const get_connection_for_uuid = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params
    const connection = await get_connection_for_uuid_service(uuid)

    delete connection.aws.keypair
    delete connection.aws.access_id
    delete connection.aws.secret_access_key

    await ApiResponseHandler.success(res, connection)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const get_ssh_key_for_connection_uuid = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params
    const connection = await get_connection_for_uuid_service(uuid, true)
    const ssh_key = decrypt(
      connection.aws.keypair,
      Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
      Buffer.from(connection.aws_meta.keypair_iv, "base64"),
      Buffer.from(connection.aws_meta.keypair_tag, "base64"),
    )
    await ApiResponseHandler.success(res, { sshkey: ssh_key })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const update_connection = async (req: Request, res: Response) => {
  try {
    const { name, id: uuid } = req.body
    let resp = await update_connection_for_uuid_service({ name, uuid })
    await ApiResponseHandler.success(res, { name: name })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const delete_connection = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const connection = await get_connection_for_uuid_service(uuid, true);
    const access_key = decrypt(
      connection.aws.access_id,
      Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
      Buffer.from(connection.aws_meta.access_id_iv, "base64"),
      Buffer.from(connection.aws_meta.access_id_tag, "base64")
    );
    const secret_access_key = decrypt(
      connection.aws.secret_access_key,
      Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
      Buffer.from(connection.aws_meta.secret_access_key_iv, "base64"),
      Buffer.from(connection.aws_meta.secret_access_key_tag, "base64")
    );
    connection.aws.access_id = access_key;
    connection.aws.secret_access_key = secret_access_key;

    let resp = await delete_connection_request(connection.connectionType, {
      ...connection,
      id: connection.uuid,
    });
    await delete_connection_for_uuid({ uuid: connection.uuid });

    await ApiResponseHandler.success(res, resp);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export {
  list_connections,
  get_connection_for_uuid,
  get_ssh_key_for_connection_uuid,
  update_connection,
  delete_connection,
};
