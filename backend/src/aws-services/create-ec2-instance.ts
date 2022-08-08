import {
  EC2Client,
  DescribeImagesCommand,
  DescribeImagesCommandInput,
  DescribeImagesCommandOutput,
  EC2ClientConfig,
  RunInstancesCommand,
  RunInstancesCommandInput,
  RunInstancesCommandOutput,
  DescribeInstanceTypesCommand,
  DescribeInstanceTypesCommandInput,
  GetInstanceTypesFromInstanceRequirementsCommand,
  GetInstanceTypesFromInstanceRequirementsCommandInput,
  InstanceTypeInfoFromInstanceRequirements,
  CreateKeyPairCommand,
  CreateKeyPairCommandInput,
  DescribeKeyPairsCommand,
  DescribeKeyPairsCommandInput,
  Image,
  KeyType,
  CreateKeyPairCommandOutput,
  VirtualizationType,
} from "@aws-sdk/client-ec2";
// For pricing approximation
// import {
//   PricingClient,
//   PricingClientConfig,
//   GetProductsCommand,
// } from "@aws-sdk/client-pricing";
import { generate_random_string } from "./utils";

export interface MachineSpecifications {
  minCpu: number;
  maxCpu: number;
  minMem: number;
  maxMem?: number;
}

export async function get_all_images(
  img_names: Array<string>,
  client: EC2Client
): Promise<Array<Image>> {
  // Create anAmazon EC2 service client object.
  const ec2Client = client;
  const input: DescribeImagesCommandInput = {
    Filters: [
      { Name: "architecture", Values: ["x86_64"] },
      { Name: "is-public", Values: ["true"] },
      { Name: "image-type", Values: ["machine"] },
      { Name: "state", Values: ["available"] },
      {
        Name: "name",
        Values: img_names,
      },
    ],
    Owners: ["099720109477"],
    IncludeDeprecated: false,
  };
  const command = new DescribeImagesCommand(input);
  const response = await ec2Client.send(command);
  return response.Images.sort(
    (a, b) =>
      new Date(a.CreationDate).getTime() - new Date(b.CreationDate).getTime()
  );
}

export async function get_latest_image(
  client: EC2Client,
  img_names: Array<string> = [
    "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-????????",
  ]
) {
  let resp = (await get_all_images(img_names, client)).pop();
  return resp;
}

export async function get_valid_types(
  client: EC2Client,
  vtx_type: VirtualizationType,
  specs: MachineSpecifications
): Promise<Array<InstanceTypeInfoFromInstanceRequirements>> {
  let command = new GetInstanceTypesFromInstanceRequirementsCommand({
    ArchitectureTypes: ["x86_64"],
    VirtualizationTypes: [vtx_type],
    InstanceRequirements: {
      VCpuCount: { Min: specs.minCpu, Max: specs.maxCpu },
      MemoryMiB: {
        Min: specs.minMem * 1024,
        Max: specs.maxMem ? specs.maxMem * 1024 : null,
      },
      InstanceGenerations: ["current"],
    },
  } as GetInstanceTypesFromInstanceRequirementsCommandInput);
  let resp = await client.send(command);
  return resp.InstanceTypes;
}

export async function describe_type(client: EC2Client, Instance_type: string) {
  let command = new DescribeInstanceTypesCommand({
    InstanceTypes: [Instance_type],
  } as DescribeInstanceTypesCommandInput);
  let resp = await client.send(command);
  return resp.InstanceTypes[0];
}

// TODO : Pricing API gives somewhat random results.
// As in, systems with linux come out to $0.00 per hour
// async function get_pricing(
//   config: PricingClientConfig,
//   instance_type: string,
//   location: string
// ) {
//   let client = new PricingClient(config);
//   let command = new GetProductsCommand({
//     Filters: [
//       { Field: "instanceType", Type: "TERM_MATCH", Value: instance_type },
//       { Field: "location", Type: "TERM_MATCH", Value: location },
//     ],
//     FormatVersion: "aws_v1",
//     ServiceCode: "AmazonEC2",
//   });
//   let resp = await client.send(command);
//   return resp;
// }

export async function create_new_keypair(client: EC2Client, name: string) {
  let command = new CreateKeyPairCommand({
    KeyName: name,
    KeyType: KeyType.ed25519,
    // TagSpecifications: [
    //   {
    //     ResourceType: "instance",
    //     Tags: [{ Key: "Created By", Value: "Metlo" }],
    //   },
    // ],
  } as CreateKeyPairCommandInput);
  let resp = await client.send(command);
  return resp;
}

export async function list_keypairs(client: EC2Client) {
  let command = new DescribeKeyPairsCommand({} as DescribeKeyPairsCommandInput);
  let resp = await client.send(command);
  return resp;
}

export async function create_new_instance(
  client: EC2Client,
  instance_ami: string,
  instance_type: string
): Promise<[RunInstancesCommandOutput, CreateKeyPairCommandOutput]> {
  const id = generate_random_string(12);
  const key = await create_new_keypair(client, `METLO-Instance-${id}-Key`);
  const command = new RunInstancesCommand({
    MaxCount: 1,
    MinCount: 1,
    ImageId: instance_ami,
    InstanceType: instance_type,
    KeyName: key.KeyName,
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "Name",
            Value: `METLO-Mirror-instance-${id}`,
          },
          { Key: "Created By", Value: "Metlo" },
        ],
      },
      {
        ResourceType: "volume",
        Tags: [
          {
            Key: "Name",
            Value: `METLO-Mirror-volume-${id}`,
          },
          { Key: "Created By", Value: "Metlo" },
        ],
      },
    ],
    BlockDeviceMappings: [
      {
        DeviceName: "/dev/sda1",
        Ebs: {
          DeleteOnTermination: true,
          VolumeSize: 8,
          VolumeType: "gp2",
          Encrypted: true,
        },
      },
    ],
  } as RunInstancesCommandInput);
  const response = await client.send(command);
  return [response, key];
}
