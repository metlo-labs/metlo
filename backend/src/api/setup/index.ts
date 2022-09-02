import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { AWS_CONNECTION, SSH_INFO, STEP_RESPONSE } from "@common/types"
import { ConnectionType } from "@common/enums"
import { setup } from "suricata_setup"
import "express-session"
import { EC2_CONN } from "suricata_setup/aws-services/create-ec2-instance"
import { VirtualizationType } from "@aws-sdk/client-ec2"
import { save_connection } from "services/connections"
import { deleteKeyFromRedis, getFromRedis } from "suricata_setup/utils"
import {
  list_images,
  list_machines,
} from "suricata_setup/gcp-services/gcp_setup"

declare module "express-session" {
  interface SessionData {
    connection_config: Record<
      string, // id
      {
        step?: STEP_RESPONSE<ConnectionType>["step_number"]
        status?: STEP_RESPONSE<ConnectionType>["status"]
        id?: string
        type?: ConnectionType
        data?: STEP_RESPONSE["data"]
      }
    >
  }
}

export const setup_connection = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { step, id, status, name, type, params } = req.body
    if (!req.session.connection_config) {
      req.session.connection_config = {}
    }
    if (!req.session.connection_config[id]) {
      req.session.connection_config[id] = {
        status: "STARTED",
        id,
        type,
        data: { id, name },
      }
    }

    let combined_params = {
      ...req.session.connection_config[id].data,
      ...params,
      id: id,
    }
    let resp = await setup(step, type, combined_params)
    req.session.connection_config[id] = {
      ...req.session.connection_config[id],
      ...resp,
    }

    if (resp.status === "COMPLETE") {
      const {
        params: { name },
      } = req.body
      await save_connection({
        conn_meta: req.session.connection_config[id].data as AWS_CONNECTION &
          SSH_INFO,
        id: id,
        name: name,
      })
    }

    delete resp.data

    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const aws_os_choices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.body
  const { access_id, secret_access_key, region } = req.session
    .connection_config[id].data as STEP_RESPONSE<ConnectionType.AWS>["data"]
  let conn = new EC2_CONN(access_id, secret_access_key, region)
  let choices = await conn.get_latest_image()
  await ApiResponseHandler.success(res, [
    [choices.Description, choices.ImageId],
  ])
}

export const gcp_os_choices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.body
    const { key_file, zone, project } = req.session.connection_config[id]
      .data as STEP_RESPONSE<ConnectionType.GCP>["data"]

    let choices = await list_images({ key_file, project, zone })
    let resp = choices.map(v => [v.description, v.selfLink])
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const aws_instance_choices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, specs } = req.body
    const { access_id, secret_access_key, virtualization_type, region } = req
      .session.connection_config[id]
      .data as STEP_RESPONSE<ConnectionType.AWS>["data"]
    let conn = new EC2_CONN(access_id, secret_access_key, region)
    let choices = await conn.get_valid_types(
      virtualization_type as VirtualizationType,
      specs,
    )
    await ApiResponseHandler.success(
      res,
      choices.map(v => v.InstanceType),
    )
  } catch (err) {
    ApiResponseHandler.error(res, err)
  }
}
export const gcp_instance_choices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, specs } = req.body
    const { key_file, zone, project } = req.session.connection_config[id]
      .data as STEP_RESPONSE<ConnectionType.GCP>["data"]

    let choices = await list_machines({
      key_file,
      zone,
      project,
      minCpu: specs.minCpu,
      maxCpu: specs.maxCpu,
      minMem: specs.minMem,
      maxMem: specs.maxMem,
    })
    await ApiResponseHandler.success(
      res,
      choices.map(v => [v.name, v.selfLink]),
    )
  } catch (err) {
    ApiResponseHandler.error(res, err)
  }
}

export const get_setup_state = async (req: Request, res: Response) => {
  const { uuid } = req.params
  try {
    let resp: STEP_RESPONSE = await getFromRedis(uuid)
    if (["OK", "FAIL"].includes(resp.success)) {
      await deleteKeyFromRedis(uuid)
    }
    req.session.connection_config[resp.data.id] = {
      ...req.session.connection_config[resp.data.id],
      ...resp,
    }
    delete resp.data
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
