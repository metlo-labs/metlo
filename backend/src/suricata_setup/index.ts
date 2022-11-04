import { ConnectionType, AWS_STEPS, GCP_STEPS } from "@common/enums"
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
import { ConnectionsService } from "services/connections"
import {
  get_destination_subnet,
  gcp_key_setup,
  gcp_source_identification,
  create_firewall_rule,
  create_cloud_router,
  create_mig,
  create_health_check,
  create_backend_service,
  create_load_balancer,
  packet_mirroring,
  test_ssh as gcp_test_ssh,
  push_files as gcp_push_files,
  execute_commands as gcp_execute_commands,
} from "./gcp-services/gcp_setup"
import { delete_gcp_data } from "./gcp-services/delete"
import { RedisClient } from "utils/redis"
import { MetloContext } from "types"

function dummy_response(uuid, step, data, type: ConnectionType) {
  if (type == ConnectionType.AWS) {
    const resp = {
      success: "FETCHING",
      status: "IN-PROGRESS",
      retry_id: uuid,
      next_step: step,
      step_number: step,
      last_completed: step - 1,
      message: `Fetching data for step ${AWS_STEPS[step]}`,
      data: data,
    } as STEP_RESPONSE<ConnectionType.AWS>
    return resp
  } else if (type == ConnectionType.GCP) {
    const resp = {
      success: "FETCHING",
      status: "IN-PROGRESS",
      retry_id: uuid,
      next_step: step,
      step_number: step,
      last_completed: step - 1,
      message: `Fetching data for step ${GCP_STEPS[step]}`,
      data: data,
    } as STEP_RESPONSE<ConnectionType.GCP>
    return resp
  }
}

export async function setup(
  ctx: MetloContext,
  step: number = 0,
  type: ConnectionType,
  metadata_for_step: STEP_RESPONSE["data"],
): Promise<STEP_RESPONSE> {
  var uuid, resp
  if (type == ConnectionType.AWS) {
    type connType = STEP_RESPONSE<ConnectionType.AWS>
    const metadata =
      metadata_for_step as STEP_RESPONSE<ConnectionType.AWS>["data"]
    switch (step) {
      case 1:
        return await aws_key_setup(metadata)
      case 2:
        return await aws_source_identification(metadata)
      case 3:
        return await aws_os_selection(metadata)
      case 4:
        return await aws_instance_selection(metadata)
      case 5:
        return await aws_instance_creation(metadata)
      case 6:
        return await get_public_ip(metadata)
      case 7:
        return await aws_mirror_target_creation(metadata)
      case 8:
        return await aws_mirror_filter_creation(metadata)
      case 9:
        return await aws_mirror_session_creation(metadata)
      case 10:
        uuid = uuidv4()
        resp = dummy_response(uuid, 10, metadata_for_step, ConnectionType.AWS)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          test_ssh({
            ...metadata,
            step: 10,
          }),
        )
        return resp
      case 11:
        uuid = uuidv4()
        resp = dummy_response(uuid, 11, metadata_for_step, ConnectionType.AWS)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          push_files({
            ...metadata,
            step: 11,
          }),
        )
        return resp
      case 12:
        uuid = uuidv4()
        resp = dummy_response(uuid, 12, metadata_for_step, ConnectionType.AWS)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          execute_commands({
            ...metadata,
            step: 12,
          } as any).then(resp => {
            if (resp.status === "COMPLETE") {
              ConnectionsService.saveConnectionAws({
                id: resp.data.id,
                name: resp.data.name,
                conn_meta: { ...resp.data } as Required<connType["data"]>,
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
    let metadata =
      metadata_for_step as STEP_RESPONSE<ConnectionType.GCP>["data"]
    switch (step) {
      case GCP_STEPS.GCP_KEY_SETUP:
        return await gcp_key_setup(metadata)
      case GCP_STEPS.SOURCE_INSTANCE_ID:
        return await gcp_source_identification(metadata)
      case GCP_STEPS.CREATE_DESTINATION_SUBNET:
        uuid = uuidv4()
        resp = await dummy_response(uuid, 3, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          get_destination_subnet(metadata),
        )
        return resp
      case GCP_STEPS.CREATE_FIREWALL:
        return await create_firewall_rule(metadata)
      case GCP_STEPS.CREATE_CLOUD_ROUTER:
        return await create_cloud_router(metadata)
      case GCP_STEPS.CREATE_MIG:
        uuid = uuidv4()
        resp = dummy_response(uuid, 6, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(ctx, uuid, create_mig(metadata))
        return resp
      case GCP_STEPS.CREATE_HEALTH_CHECK:
        uuid = uuidv4()
        resp = dummy_response(uuid, 8, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          create_health_check(metadata),
        )
        return resp
      case GCP_STEPS.CREATE_BACKEND_SERVICE:
        uuid = uuidv4()
        resp = dummy_response(uuid, 9, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)

        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          create_backend_service(metadata),
        )
        return resp
      case GCP_STEPS.CREATE_ILB:
        uuid = uuidv4()
        resp = dummy_response(uuid, 10, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)

        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          create_load_balancer(metadata),
        )
        return resp
      case GCP_STEPS.START_PACKET_MIRRORING:
        uuid = uuidv4()
        resp = dummy_response(uuid, 11, metadata, ConnectionType.GCP)
        await RedisClient.addToRedis(ctx, uuid, resp)

        RedisClient.addToRedisFromPromise(ctx, uuid, packet_mirroring(metadata))
        return resp
      case GCP_STEPS.TEST_SSH:
        uuid = uuidv4()
        resp = dummy_response(
          uuid,
          GCP_STEPS.TEST_SSH,
          metadata,
          ConnectionType.GCP,
        )
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(ctx, uuid, gcp_test_ssh(metadata))
        return resp
      case GCP_STEPS.PUSH_FILES:
        uuid = uuidv4()
        resp = dummy_response(
          uuid,
          GCP_STEPS.PUSH_FILES,
          metadata_for_step,
          ConnectionType.GCP,
        )
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(ctx, uuid, gcp_push_files(metadata))
        return resp
      case GCP_STEPS.EXEC_COMMAND:
        uuid = uuidv4()
        resp = dummy_response(
          uuid,
          GCP_STEPS.EXEC_COMMAND,
          metadata_for_step,
          ConnectionType.GCP,
        )
        await RedisClient.addToRedis(ctx, uuid, resp)
        RedisClient.addToRedisFromPromise(
          ctx,
          uuid,
          gcp_execute_commands(metadata).then(resp => {
            if (resp.status === "COMPLETE") {
              ConnectionsService.saveConnectionGcp({
                id: resp.data.id,
                name: resp.data.name,
                conn_meta: {
                  ...resp.data,
                } as Required<STEP_RESPONSE<ConnectionType.GCP>["data"]>,
              })
            }
            return resp
          }),
        )
        return resp
      default:
        throw Error(`Don't have step ${step} registered`)
    }
  }
}

export async function delete_connection(
  type: ConnectionType,
  connection_data: STEP_RESPONSE["data"],
): Promise<void> {
  if (type === ConnectionType.AWS) {
    let _ = await delete_aws_data(
      connection_data as STEP_RESPONSE<ConnectionType.AWS>["data"],
    )
    return
  } else if (type === ConnectionType.GCP) {
    let _ = await delete_gcp_data(
      connection_data as STEP_RESPONSE<ConnectionType.GCP>["data"],
    )
    return
  } else {
    throw new Error(`No data for type ${type}`)
  }
}
