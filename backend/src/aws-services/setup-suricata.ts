import {
  CreateTrafficMirrorFilterCommandOutput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { randomUUID } from "crypto";
import { EC2_CONN } from "./create-ec2-instance";
import {
  create_mirror_filter,
  create_mirror_filter_rules,
  create_mirror_session,
  create_mirror_target,
  delete_mirror_filter,
} from "./create-mirror";
import { format, put_data_file, remove_file, SSH_CONN } from "./ssh-setup";
import {
  get_network_id_for_instance,
  get_public_ip_for_network_interface,
  list_all_instances,
  match_av_to_region,
} from "./utils";
import retry from "async-retry";

import { STEP_RESPONSE } from "@common/types";
import { ConnectionType } from "@common/enums";

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

async function aws_key_setup({
  access_id,
  secret_access_key,
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
    });
    let region = await list_all_instances(client);
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

async function aws_source_identification({
  access_id,
  secret_access_key,
  source_instance_id,
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
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
      },
    };
  }
}

async function aws_os_selection({
  access_id,
  secret_access_key,
  ami,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let conn = new EC2_CONN(access_id, secret_access_key);
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
        ...rest,
      },
    };
  }
}

async function aws_instance_selection({
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
        ...rest,
      },
    };
  }
}

async function aws_instance_creation({
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

async function get_public_ip({
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

async function aws_mirror_target_creation({
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

async function aws_mirror_filter_creation({
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

async function aws_mirror_session_creation({
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

async function test_ssh({
  keypair,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  var conn;
  try {
    conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu");
    await retry(async () => await conn.test_connection());
    conn.disconnect();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 11,
      last_completed: 10,
      message: "Testing SSH connection to remote machine.",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  } catch (err) {
    if (conn && conn instanceof SSH_CONN) conn.disconnect();
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 11,
      last_completed: 9,
      message: `Couldn't connect to ssh. Please check if key was constructed`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  }
}

async function push_files({
  keypair,
  backend_url,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  let conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu");
  try {
    let filepath = `./src/aws-services/scripts/metlo-ingestor-${randomUUID()}.service`;
    await put_data_file(
      format("./src/aws-services/scripts/metlo-ingestor-template.service", [
        backend_url,
      ]),
      filepath
    );
    await conn.putfiles(
      [
        "./src/aws-services/scripts/install.sh",
        "./src/aws-services/scripts/install-nvm.sh",
        "./src/aws-services/scripts/local.rules",
        "./src/aws-services/scripts/suricata.yaml",
        filepath,
      ],
      [
        "install.sh",
        "install-nvm.sh",
        "local.rules",
        "suricata.yaml",
        "metlo-ingestor.service",
      ]
    );
    remove_file(filepath);
    conn.disconnect();
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 12,
      last_completed: 11,
      message: "Pushed configuration files to remote machine",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        backend_url,
        ...rest,
      },
    };
  } catch (err) {
    conn.disconnect();
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 12,
      last_completed: 10,
      message: `Couldn't push configuration files to remote machine`,
      error: {
        err: err,
      },
      data: {
        keypair,
        backend_url,
        remote_machine_url,
        ...rest,
      },
    };
  }
}

async function execute_commands({
  keypair,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  let conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu");
  try {
    await conn.run_command(
      "source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install-nvm.sh && ./install-nvm.sh "
    );
    await conn.run_command(
      "source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install.sh && ./install.sh "
    );
    conn.disconnect();

    return {
      success: "OK",
      status: "COMPLETE",
      step_number: 12,
      next_step: null,
      last_completed: 12,
      message: "Executed configuration files on remote machine succesfully",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  } catch (err) {
    conn.disconnect();
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 12,
      next_step: null,
      last_completed: 11,
      message: `Couldn't exec commands to install things`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  }
}
