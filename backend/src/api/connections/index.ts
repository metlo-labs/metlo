import { Response } from "express"
import { ConnectionsService } from "services/connections"
import ApiResponseHandler from "api-response-handler"
import { decrypt } from "utils/encryption"
import { delete_connection as delete_connection_request } from "suricata_setup/"
import { ConnectionType } from "@common/enums"
import { randomUUID } from "crypto"
import { RedisClient } from "utils/redis"
import { MetloRequest } from "types"

const listConnections = async (req: MetloRequest, res: Response) => {
  try {
    const connections = (await ConnectionsService.listConnections(req.ctx)).map(
      v => {
        if (v.connectionType === ConnectionType.AWS) {
          delete v.aws.keypair
          delete v.aws.access_id
          delete v.aws.secret_access_key
        } else if (v.connectionType === ConnectionType.GCP) {
          delete v.gcp.key_file
        }
        return v
      },
    )

    await ApiResponseHandler.success(res, connections)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const getConnectionForUuid = async (req: MetloRequest, res: Response) => {
  try {
    const { uuid } = req.params
    const connection = await ConnectionsService.getConnectionForUuid(
      req.ctx,
      uuid,
    )

    delete connection.aws.keypair
    delete connection.aws.access_id
    delete connection.aws.secret_access_key

    await ApiResponseHandler.success(res, connection)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const getSshKeyForConnectionUuid = async (req: MetloRequest, res: Response) => {
  try {
    const { uuid } = req.params
    const connection = await ConnectionsService.getConnectionForUuid(
      req.ctx,
      uuid,
      true,
    )
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

const updateConnection = async (req: MetloRequest, res: Response) => {
  try {
    const { name, id: uuid } = req.body
    let resp = await ConnectionsService.updateConnectionForUuid(req.ctx, {
      name,
      uuid,
    })
    await ApiResponseHandler.success(res, { name: name })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const deleteConnection = async (req: MetloRequest, res: Response) => {
  const { uuid } = req.params
  try {
    const connection = await ConnectionsService.getConnectionForUuid(
      req.ctx,
      uuid,
      true,
    )
    const retry_uuid = randomUUID()
    await RedisClient.addToRedis(req.ctx, retry_uuid, { success: "FETCHING" })
    if (connection.connectionType === ConnectionType.AWS) {
      const access_key = decrypt(
        connection.aws.access_id,
        Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
        Buffer.from(connection.aws_meta.access_id_iv, "base64"),
        Buffer.from(connection.aws_meta.access_id_tag, "base64"),
      )
      const secret_access_key = decrypt(
        connection.aws.secret_access_key,
        Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
        Buffer.from(connection.aws_meta.secret_access_key_iv, "base64"),
        Buffer.from(connection.aws_meta.secret_access_key_tag, "base64"),
      )
      connection.aws.access_id = access_key
      connection.aws.secret_access_key = secret_access_key

      RedisClient.addToRedisFromPromise(
        req.ctx,
        retry_uuid,
        delete_connection_request(connection.connectionType, {
          ...connection.aws,
          id: connection.uuid,
          name: connection.name,
        })
          .then(() => {
            return ConnectionsService.deleteConnectionForUuid(req.ctx, {
              uuid: connection.uuid,
            }).then(() => ({
              success: "OK",
            }))
          })
          .catch(err => ({ success: "FAIL", error: JSON.stringify(err) })),
      )
    } else if (connection.connectionType === ConnectionType.GCP) {
      const key_file = decrypt(
        connection.gcp.key_file,
        Buffer.from(process.env.ENCRYPTION_KEY, "base64"),
        Buffer.from(connection.gcp_meta.key_file_iv, "base64"),
        Buffer.from(connection.gcp_meta.key_file_tag, "base64"),
      )
      connection.gcp.key_file = key_file

      RedisClient.addToRedisFromPromise(
        req.ctx,
        retry_uuid,
        delete_connection_request(connection.connectionType, {
          ...connection.gcp,
          id: connection.uuid,
          name: connection.name,
        })
          .then(() => {
            return ConnectionsService.deleteConnectionForUuid(req.ctx, {
              uuid: connection.uuid,
            }).then(() => ({
              success: "OK",
            }))
          })
          .catch(err => ({ success: "FAIL", error: JSON.stringify(err) })),
      )
    }

    await ApiResponseHandler.success(res, { uuid: retry_uuid })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export {
  listConnections,
  getConnectionForUuid,
  getSshKeyForConnectionUuid,
  updateConnection,
  deleteConnection,
}
