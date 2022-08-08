import {
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  create_new_instance,
  get_latest_image,
  get_valid_types,
  MachineSpecifications,
} from "./create-ec2-instance";

export enum STEPS {
  // SETUP MIRROR INSTANCE
  AWS_KEY_SETUP = 1,
  SOURCE_INSTANCE_ID = 2,
  SELECT_OS = 3,
  SELECT_INSTANCE_TYPE = 4,
  CREATE_INSTANCE = 5,
  SOURCE_ENI_ID = 6,
  CREATE_MIRROR_TARGET = 7,
  CREATE_MIRROR_FILTER = 8,
  CREATE_MIRROR_SESSION = 9,
}

export interface STEP_RESPONSE {
  success: "OK" | "FAIL";
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
      return await STEP_5(metadata_for_step as any);
    default:
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
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
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
  console.log(access_id, secret_access_key, source_instance_id);
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
    client.destroy();
    return {
      success: "OK",
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        source_instance_id: source_instance_id,
        region: resp.Reservations[0].Instances[0].Placement.AvailabilityZone,
      },
    } as STEP_RESPONSE;
  } catch (err) {
    return {
      success: "FAIL",
      error: {
        message: "Couldn't verify EC2 source instance for mirroring traffic",
        err: err,
      },
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
      },
    } as STEP_RESPONSE;
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
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
        ...rest,
        ami: resp.ImageId,
        virtualization_type: resp.VirtualizationType,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
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
    console.log(resp);
    console.log(resp.map((v) => v.InstanceType));
    return {
      success: "OK",
      error: null,
      keep: {
        secret_access_key,
        access_id,
        instance_types: resp.map((v) => v.InstanceType),
        virtualization_type,
        machine_specs,
        ...rest,
      },
    };
  } catch (err) {
    return {
      success: "FAIL",
      error: {
        message: "Couldn't list valid instance type for EC2 instance.",
        err: err,
      },
      keep: {
        secret_access_key,
        access_id,
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
    });
    let resp = await create_new_instance(client, ami, selected_instance_type);
    client.destroy();
    return {
      success: "OK",
      error: null,
      keep: {
        secret_access_key: secret_access_key,
        access_id: access_id,
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
      error: {
        message: "Couldn't list valid instance type for EC2 instance.",
        err: err,
      },
      keep: {
        secret_access_key,
        access_id,
        ami,
        selected_instance_type,
        ...rest,
      },
    };
  }
}
