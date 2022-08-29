import { ConnectionType, STEPS } from "@common/enums"
import { STEP_RESPONSE } from "@common/types"
import {
  aws_instance_creation,
  aws_instance_selection,
  aws_key_setup,
  aws_mirror_filter_creation,
  aws_mirror_session_creation,
  aws_mirror_target_creation,
  aws_os_selection,
  aws_source_identification,
  get_public_ip,
} from "./aws-services/aws_setup"
import { delete_aws_data } from "./aws-services/delete"
import { test_ssh, push_files, execute_commands } from "./ssh-services"
import { v4 as uuidv4 } from "uuid"
import { addToRedis, addToRedisFromPromise } from "./utils"
import { save_connection } from "services/connections"

function dummy_response(uuid, step, data) {
  const resp = {
    success: "FETCHING",
    status: "IN-PROGRESS",
    retry_id: uuid,
    next_step: step,
    step_number: step,
    last_completed: step - 1,
    message: `Fetching data for step ${STEPS[step]}`,
    data: data,
  } as STEP_RESPONSE
  return resp
}

export async function setup(
  step: number = 0,
  type: ConnectionType,
  metadata_for_step: STEP_RESPONSE["data"],
): Promise<STEP_RESPONSE> {
  var uuid, resp
  if (type == ConnectionType.AWS) {
    switch (step) {
      case 1:
        return await aws_key_setup(metadata_for_step as any)
      case 2:
        return await aws_source_identification(metadata_for_step as any)
      case 3:
        return await aws_os_selection(metadata_for_step as any)
      case 4:
        return await aws_instance_selection(metadata_for_step as any)
      case 5:
        return await aws_instance_creation(metadata_for_step as any)
      case 6:
        return await get_public_ip(metadata_for_step as any)
      case 7:
        return await aws_mirror_target_creation(metadata_for_step as any)
      case 8:
        return await aws_mirror_filter_creation(metadata_for_step as any)
      case 9:
        return await aws_mirror_session_creation(metadata_for_step as any)
      case 10:
        uuid = uuidv4()
        resp = dummy_response(uuid, 10, metadata_for_step)
        await addToRedis(uuid, resp)
        addToRedisFromPromise(
          uuid,
          test_ssh({
            ...metadata_for_step,
          }),
        )
        return resp
      case 11:
        uuid = uuidv4()
        resp = dummy_response(uuid, 11, metadata_for_step)
        await addToRedis(uuid, resp)
        addToRedisFromPromise(
          uuid,
          push_files({
            ...metadata_for_step,
          }),
        )
        return resp
      case 12:
        uuid = uuidv4()
        resp = dummy_response(uuid, 12, metadata_for_step)
        await addToRedis(uuid, resp)
        addToRedisFromPromise(
          uuid,
          execute_commands({
            ...metadata_for_step,
          } as any).then(resp => {
            if (resp.status === "COMPLETE") {
              save_connection({
                id: resp.data.id,
                name: resp.data.name,
                conn_meta: { ...resp.data } as Required<STEP_RESPONSE["data"]>,
              })
            }
            return resp
          }),
        )
        return resp
      default:
        throw Error(`Don't have step ${step} registered`)
        break
    }
  } else if (type == ConnectionType.GCP) {
    return {
      success: "FAIL",
      status: "COMPLETE",
      step_number: 1,
      next_step: 2,
      last_completed: 1,
      message: "Not configured yet for GCP",
      error: {
        err: "Not configured yet for GCP",
      },
      data: metadata_for_step,
    }
  }
}

export async function delete_connection(
  type: ConnectionType,
  connection_data: STEP_RESPONSE["data"],
): Promise<string> {
  if (type === ConnectionType.AWS) {
    return await delete_aws_data(connection_data)
  } else if (type === ConnectionType.GCP) {
    throw new Error("GCP connections are not defined yet")
  } else {
    throw new Error(`No data for type ${type}`)
  }
}
