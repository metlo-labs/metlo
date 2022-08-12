import {
  CreateTrafficMirrorFilterCommandOutput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { randomUUID } from "crypto";
import { MachineSpecifications, EC2_CONN } from "./create-ec2-instance";
import {
  create_mirror_filter,
  create_mirror_filter_rules,
  create_mirror_session,
  create_mirror_target,
  delete_mirror_filter,
  TrafficFilterRuleSpecs,
} from "./create-mirror";
import { format, put_data_file, remove_file, SSH_CONN } from "./ssh-setup";
import {
  get_network_id_for_instance,
  get_public_ip_for_network_interface,
  match_av_to_region,
} from "./utils";

export enum STEPS {
  // SETUP MIRROR INSTANCE
  AWS_KEY_SETUP = 1,
  SOURCE_INSTANCE_ID = 2,
  SELECT_OS = 3,
  SELECT_INSTANCE_TYPE = 4,
  CREATE_INSTANCE = 5,
  INSTANCE_IP = 6,
  CREATE_MIRROR_TARGET = 7,
  CREATE_MIRROR_FILTER = 8,
  CREATE_MIRROR_SESSION = 9,
  TEST_SSH = 10,
  PUSH_FILES = 11,
  EXEC_COMMAND = 12,
}

export interface STEP_RESPONSE {
  success: "OK" | "FAIL";
  step_number: number;
  last_completed: number;
  error?: {
    message: string;
    err: "string";
  };
  keep: {
    secret_access_key?: string;
    access_id?: string;
    source_instance_id?: string;
    region?: string;
    ami?: string;
    os_types?: string[];
    instance_types?: string[];
    machine_specs?: MachineSpecifications;
    selected_instance_type?: string;
    mirror_instance_id?: string;
    mirror_target_id?: string;
    mirror_filter_id?: string;
    mirror_rules?: Array<TrafficFilterRuleSpecs>;
    keypair?: string;
    destination_eni_id?: string;
    virtualization_type?: string;
    backend_url?: string;
    remote_machine_url?: string;
  };
}

async function setup(
  step: number = 0,
  metadata_for_step: Object = {}
): Promise<STEP_RESPONSE> {
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
    client.destroy();
    return {
      success: "OK",
      step_number: 1,
      last_completed: 1,
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      step_number: 1,
      last_completed: 0,
      error: {
        message:
          "Couldn't verify AWS Credentials. Please verify that access id and secret access key are correct.",
        err: err,
      },
      keep: {},
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
      step_number: 2,
      last_completed: 2,
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        source_instance_id: source_instance_id,
        region: region.RegionName,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      step_number: 2,
      last_completed: 1,
      error: {
        message: "Couldn't verify EC2 source instance for mirroring traffic",
        err: err,
      },
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
      },
    };
  }
}

async function aws_os_selection({
  access_id,
  secret_access_key,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let conn = new EC2_CONN(access_id, secret_access_key);
    let resp = await conn.get_latest_image();
    conn.disconnect();
    return {
      success: "OK",
      step_number: 3,
      last_completed: 3,
      error: null,
      keep: {
        secret_access_key,
        access_id,
        ...rest,
        ami: resp.ImageId,
        virtualization_type: resp.VirtualizationType,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      step_number: 3,
      last_completed: 2,
      error: {
        message: "Couldn't obtain proper image for EC2 instance.",
        err: err,
      },
      keep: {
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
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let conn = new EC2_CONN(access_id, secret_access_key);
    let resp = await conn.get_valid_types(virtualization_type, machine_specs);
    conn.disconnect();
    return {
      success: "OK",
      step_number: 4,
      last_completed: 4,
      error: null,
      keep: {
        secret_access_key,
        access_id,
        region,
        instance_types: resp.map((v) => v.InstanceType),
        virtualization_type,
        machine_specs,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      step_number: 4,
      last_completed: 3,
      error: {
        message: "Couldn't list valid instance type for EC2 instance.",
        err: err,
      },
      keep: {
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
      error: null,
      step_number: 5,
      last_completed: 5,
      keep: {
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
      step_number: 5,
      last_completed: 4,
      error: {
        message: `Couldn't create new instance of type ${selected_instance_type} with ami ${ami} on EC2.`,
        err: err,
      },
      keep: {
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
      error: null,
      step_number: 6,
      last_completed: 5,
      keep: {
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
      step_number: 6,
      last_completed: 5,
      error: {
        message: `Couldn't get public ip for instance ${destination_eni_id} on EC2.`,
        err: err,
      },
      keep: {
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
      step_number: 7,
      last_completed: 7,
      error: null,
      keep: {
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
      step_number: 7,
      last_completed: 5,
      error: {
        message: `Couldn't create a mirror target out of ${source_instance_id}`,
        err: err,
      },
      keep: {
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
      step_number: 8,
      last_completed: 7,
      error: {
        message: `Couldn't create a mirror filter`,
        err: err,
      },
      keep: {
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
      step_number: 8,
      last_completed: 8,
      error: null,
      keep: {
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
      step_number: 8,
      last_completed: 7,
      error: {
        message: `Couldn't create rules for filter id. Rolling back changes to filter and deleting it.`,
        err: err,
      },
      keep: {
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
      step_number: 9,
      last_completed: 9,
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        region,
        destination_eni_id,
        mirror_filter_id,
        mirror_target_id,
        mirror_instance_id: resp.TrafficMirrorSession.TrafficMirrorTargetId,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      step_number: 9,
      last_completed: 8,
      error: {
        message: `Couldn't create a mirror session targeting ${destination_eni_id}`,
        err: err,
      },
      keep: {
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
    await conn.test_connection();
    conn.disconnect();
    return {
      success: "OK",
      step_number: 10,
      last_completed: 10,
      error: null,
      keep: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  } catch (err) {
    if (conn && conn instanceof SSH_CONN) conn.disconnect();
    return {
      success: "FAIL",
      step_number: 10,
      last_completed: 9,
      error: {
        message: `Couldn't connect to ssh. Please check if key was constructed`,
        err: err,
      },
      keep: {
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
      step_number: 11,
      last_completed: 11,
      error: null,
      keep: {
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
      step_number: 11,
      last_completed: 10,
      error: {
        message: `Couldn't push files to remote machine`,
        err: err,
      },
      keep: {
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
      step_number: 12,
      last_completed: 12,
      error: null,
      keep: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  } catch (err) {
    conn.disconnect();
    return {
      success: "FAIL",
      step_number: 12,
      last_completed: 11,
      error: {
        message: `Couldn't exec commands to install things`,
        err: err,
      },
      keep: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    };
  }
}