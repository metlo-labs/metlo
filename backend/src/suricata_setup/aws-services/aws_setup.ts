import {
  CreateTrafficMirrorFilterCommandOutput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { randomUUID } from "crypto";
import { EC2_CONN } from "./create-ec2-instance";
import { STSClient } from "@aws-sdk/client-sts";
import {
  create_mirror_filter,
  create_mirror_filter_rules,
  create_mirror_session,
  create_mirror_target,
  delete_mirror_filter,
} from "./create-mirror";
import {
  get_network_id_for_instance,
  get_public_ip_for_network_interface,
  list_all_instances,
  match_av_to_region,
  verifyIdentity,
} from "./utils";

import { STEP_RESPONSE } from "@common/types";

export async function aws_key_setup({
  access_id,
  secret_access_key,
  region,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new STSClient({
      credentials: {
        accessKeyId: access_id,
        secretAccessKey: secret_access_key,
      },
      region,
    });
    await verifyIdentity(client);
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 1,
      next_step: 2,
      last_completed: 1,
      message: "Verified AWS Credentials",
      error: null,
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 1,
      next_step: 2,
      last_completed: 0,
      message:
        "Couldn't verify AWS Credentials. Please verify that access id and secret access key are correct.",
      error: {
        err: err,
      },
      data: {},
    };
  }
}

export async function aws_source_identification({
  access_id,
  secret_access_key,
  source_instance_id,
  region: _region,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
      region: _region,
    });
    let command = new DescribeInstancesCommand({
      InstanceIds: [source_instance_id],
    } as DescribeInstancesCommandInput);
    let resp = await client.send(command);
    let region = await match_av_to_region(
      client,
      resp.Reservations[0].Instances[0].Placement.AvailabilityZone
    );
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 2,
      next_step: 3,
      last_completed: 2,
      message: "Verfied EC2 data mirror instance",
      error: null,
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        source_instance_id: source_instance_id,
        region: region.RegionName,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 2,
      next_step: 3,
      last_completed: 1,
      message: "Couldn't verify EC2 source instance for mirroring traffic",
      error: {
        err: err,
      },
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region: _region,
        ...rest,
      },
    };
  }
}

export async function aws_os_selection({
  access_id,
  secret_access_key,
  ami,
  region,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let conn = new EC2_CONN(access_id, secret_access_key, region);
    let resp = await conn.image_from_ami(ami);
    conn.disconnect();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 3,
      next_step: 4,
      last_completed: 3,
      message: "Compatible OS images found",
      error: null,
      data: {
        secret_access_key,
        access_id,
        region,
        ami,
        virtualization_type: resp[0].VirtualizationType,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 3,
      next_step: 4,
      last_completed: 2,
      message: "Couldn't obtain proper image for EC2 instance.",
      error: {
        err: err,
      },
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        ami,
        ...rest,
      },
    };
  }
}

export async function aws_instance_selection({
  access_id,
  secret_access_key,
  region,
  virtualization_type,
  machine_specs,
  selected_instance_type,
  ami,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 4,
      next_step: 5,
      last_completed: 4,
      message: "Compatiable instances shown.",
      error: null,
      data: {
        secret_access_key,
        access_id,
        region,
        selected_instance_type,
        virtualization_type,
        machine_specs,
        ami,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 4,
      next_step: 5,
      last_completed: 3,
      message: "Couldn't list valid instance type for EC2 instance.",
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        virtualization_type,
        machine_specs,
        ami,
        ...rest,
      },
    };
  }
}

export async function aws_instance_creation({
  access_id,
  secret_access_key,
  region,
  ami,
  selected_instance_type,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let conn = new EC2_CONN(access_id, secret_access_key, region);
    let resp = await conn.create_new_instance(
      ami,
      selected_instance_type,
      randomUUID()
    );
    conn.disconnect();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      error: null,
      step_number: 5,
      next_step: 6,
      last_completed: 5,
      message: `AWS of type ${selected_instance_type} Instance created`,
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        selected_instance_type,
        mirror_instance_id: resp[0].Instances[0].InstanceId,
        keypair: resp[1].KeyMaterial,
        destination_eni_id:
          resp[0].Instances[0].NetworkInterfaces[0].NetworkInterfaceId,
        ami,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 5,
      next_step: 6,
      last_completed: 4,
      message: `Couldn't create new instance of type ${selected_instance_type} with ami ${ami} on EC2.`,
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        ami,
        selected_instance_type,
        ...rest,
      },
    };
  }
}

export async function get_public_ip({
  access_id,
  secret_access_key,
  region,
  destination_eni_id,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
      region: region,
    });
    let resp = await get_public_ip_for_network_interface(
      client,
      destination_eni_id
    );
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      message: "Found IP for mirror target instance",
      error: null,
      step_number: 6,
      next_step: 7,
      last_completed: 5,
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        remote_machine_url: resp,
        destination_eni_id,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 6,
      next_step: 7,
      last_completed: 5,
      message: `Couldn't get public ip for instance ${destination_eni_id} on EC2.`,
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        destination_eni_id,
        ...rest,
      },
    };
  }
}

export async function aws_mirror_target_creation({
  access_id,
  secret_access_key,
  region,
  source_instance_id,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
      region: region,
    });
    let resp = await create_mirror_target(
      client,
      await get_network_id_for_instance(client, source_instance_id),
      randomUUID()
    );
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      message: "Configured mirror target on AWS",
      step_number: 7,
      next_step: 8,
      last_completed: 7,
      error: null,
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        source_instance_id,
        mirror_target_id: resp.TrafficMirrorTarget.TrafficMirrorTargetId,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 7,
      next_step: 8,
      last_completed: 5,
      message: `Couldn't create a mirror target out of ${source_instance_id}`,
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        source_instance_id,
        ...rest,
      },
    };
  }
}

export async function aws_mirror_filter_creation({
  access_id,
  secret_access_key,
  region,
  mirror_rules,
  ...rest
}): Promise<STEP_RESPONSE> {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  });
  let filter: CreateTrafficMirrorFilterCommandOutput;
  try {
    filter = await create_mirror_filter(client, randomUUID());
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 8,
      next_step: 9,
      last_completed: 7,
      message: `Couldn't create a mirror filter`,
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        mirror_rules,
        ...rest,
      },
    };
  }
  try {
    let _ = await create_mirror_filter_rules(
      client,
      randomUUID(),
      mirror_rules,
      filter.TrafficMirrorFilter.TrafficMirrorFilterId
    );
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 8,
      next_step: 9,
      last_completed: 8,
      error: null,
      message: "Created provided Traffic Filter(s)",
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        mirror_rules,
        mirror_filter_id: filter.TrafficMirrorFilter.TrafficMirrorFilterId,
        ...rest,
      },
    };
  } catch (err) {
    await delete_mirror_filter(
      client,
      filter.TrafficMirrorFilter.TrafficMirrorFilterId,
      randomUUID()
    );
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 8,
      next_step: 9,
      last_completed: 7,
      message: `Couldn't create rules for filter id. Rolling back changes to filter and deleting it.`,
      error: {
        err: err,
      },
      data: {
        secret_access_key,
        access_id,
        region,
        mirror_rules,
        ...rest,
      },
    };
  }
}

export async function aws_mirror_session_creation({
  access_id,
  secret_access_key,
  region,
  destination_eni_id,
  mirror_filter_id,
  mirror_target_id,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
      region: region,
    });
    let resp = await create_mirror_session(
      client,
      randomUUID(),
      destination_eni_id,
      mirror_filter_id,
      mirror_target_id
    );
    client.destroy();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 9,
      next_step: 10,
      last_completed: 9,
      error: null,
      message: "Configured mirror session succesfully",
      data: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        destination_eni_id,
        mirror_filter_id,
        mirror_target_id,
        mirror_session_id: resp.TrafficMirrorSession.TrafficMirrorSessionId,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 9,
      next_step: 10,
      last_completed: 8,
      message: `Couldn't create a mirror session targeting ${destination_eni_id}`,
      error: {
        err: err,
      },
      data: {
        access_id,
        secret_access_key,
        region,
        destination_eni_id,
        mirror_filter_id,
        mirror_target_id,
        ...rest,
      },
    };
  }
}
