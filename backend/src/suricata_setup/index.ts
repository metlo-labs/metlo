import { ConnectionType } from "@common/enums";
import { STEP_RESPONSE } from "@common/types";
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
} from "./aws-services/aws_setup";
import { test_ssh, push_files, execute_commands } from "./ssh-services";

export async function setup(
  step: number = 0,
  type: ConnectionType,
  metadata_for_step: Object = {}
): Promise<STEP_RESPONSE> {
  if (type == ConnectionType.AWS) {
    switch (step) {
      case 1:
        return await aws_key_setup(metadata_for_step as any);
      case 2:
        return await aws_source_identification(metadata_for_step as any);
      case 3:
        return await aws_os_selection(metadata_for_step as any);
      case 4:
        return await aws_instance_selection(metadata_for_step as any);
      case 5:
        return await aws_instance_creation(metadata_for_step as any);
      case 6:
        return await get_public_ip(metadata_for_step as any);
      case 7:
        return await aws_mirror_target_creation(metadata_for_step as any);
      case 8:
        return await aws_mirror_filter_creation(metadata_for_step as any);
      case 9:
        return await aws_mirror_session_creation(metadata_for_step as any);
      case 10:
        return await test_ssh(metadata_for_step as any);
      case 11:
        return await push_files(metadata_for_step as any);
      case 12:
        return await execute_commands(metadata_for_step as any);
      default:
        throw Error(`Don't have step ${step} registered`);
        break;
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
      data: {},
    };
  }
}
