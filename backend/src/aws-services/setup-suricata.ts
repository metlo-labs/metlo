import {
  CreateTrafficMirrorFilterCommandOutput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { randomUUID } from "crypto";
import {
  create_new_instance,
  get_latest_image,
  get_valid_types,
  MachineSpecifications,
} from "./create-ec2-instance";
import {
  create_mirror_filter,
  create_mirror_filter_rules,
  create_mirror_session,
  create_mirror_target,
  delete_mirror_filter,
  protocols,
  TrafficFilterRuleSpecs,
} from "./create-mirror";
import { get_network_id_for_instance, match_av_to_region } from "./utils";

export enum STEPS {
  // SETUP MIRROR INSTANCE
  AWS_KEY_SETUP = 1,
  SOURCE_INSTANCE_ID = 2,
  SELECT_OS = 3,
  SELECT_INSTANCE_TYPE = 4,
  CREATE_INSTANCE = 5,
  CREATE_MIRROR_TARGET = 6,
  CREATE_MIRROR_FILTER = 7,
  CREATE_MIRROR_SESSION = 8,
}

export interface STEP_RESPONSE {
  success: "OK" | "FAIL";
  step_number: number;
  last_completed: number;
  error?: {
    message: string;
    err: any;
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
  };
}

async function setup(
  step: number = 0,
  metadata_for_step: Object = {}
): Promise<STEP_RESPONSE> {
  switch (step) {
    case 1:
      return await STEP_1(metadata_for_step as any);
    case 2:
      return await STEP_2(metadata_for_step as any);
    case 3:
      return await STEP_3(metadata_for_step as any);
    case 4:
      return await STEP_4(metadata_for_step as any);
    case 5:
      return await STEP_5(metadata_for_step as any);
    case 6:
      return await STEP_6(metadata_for_step as any);
    case 7:
      return await STEP_7(metadata_for_step as any);
    case 8:
      return await STEP_8(metadata_for_step as any);
    default:
      throw Error(`Don't have step ${step} registered`);
      break;
  }
}

async function STEP_1({
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

async function STEP_2({
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

async function STEP_3({
  access_id,
  secret_access_key,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
    });
    let resp = await get_latest_image(client);
    client.destroy();
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

async function STEP_4({
  access_id,
  secret_access_key,
  region,
  virtualization_type,
  machine_specs,
  ...rest
}): Promise<STEP_RESPONSE> {
  try {
    let client = new EC2Client({
      credentials: {
        secretAccessKey: secret_access_key,
        accessKeyId: access_id,
      },
    });
    let resp = await get_valid_types(
      client,
      virtualization_type,
      machine_specs
    );
    client.destroy();
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

async function STEP_5({
  access_id,
  secret_access_key,
  region,
  ami,
  selected_instance_type,
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
    let resp = await create_new_instance(
      client,
      ami,
      selected_instance_type,
      randomUUID()
    );
    client.destroy();
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

async function STEP_6({
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
      step_number: 6,
      last_completed: 6,
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
      step_number: 6,
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

async function STEP_7({
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
      step_number: 7,
      last_completed: 6,
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
      step_number: 7,
      last_completed: 7,
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
      step_number: 7,
      last_completed: 6,
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

async function STEP_8({
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
      step_number: 8,
      last_completed: 8,
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
      step_number: 8,
      last_completed: 7,
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
