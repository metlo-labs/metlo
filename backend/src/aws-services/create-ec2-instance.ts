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

const supported_instances = [
  "a1",
  "c5",
  "c5a",
  "c5ad",
  "c5d",
  "c5n",
  "c6a",
  "c6g",
  "c6gd",
  "c6gn",
  "c6i",
  "c6id",
  "d3",
  "d3en",
  "dl1",
  "g4",
  "g4ad",
  "g5",
  "g5g",
  "hpc6a",
  "i3en",
  "i4i",
  "im4gn",
  "inf1",
  "is4gen",
  "m5",
  "m5a",
  "m5ad",
  "m5d",
  "m5dn",
  "m5n",
  "m5zn",
  "m6a",
  "m6g",
  "m6gd",
  "m6i",
  "m6id",
  "p3dn.24xlarge",
  "p4",
  "r5",
  "r5a",
  "r5ad",
  "r5b",
  "r5d",
  "r5dn",
  "r5n",
  "r6a",
  "r6g",
  "r6gd",
  "r6i",
  "r6id",
  "t3",
  "t3a",
  "t4g",
  "u-6tb1.56xlarge",
  "u-6tb1.112xlarge",
  "u-9tb1.112xlarge",
  "u-12tb1.112xlarge",
  "vt1",
  "x2gd",
  "x2idn",
  "x2iedn",
  "x2iezn",
  "z1d",
  "a1.metal",
  "c5.metal",
  "c5d.metal",
  "c5n.metal",
  "c6a.metal",
  "c6g.metal",
  "c6gd.metal",
  "c6i.metal",
  "c6id.metal",
  "g4dn.metal",
  "g5g.metal",
  "i3.metal",
  "i3en.metal",
  "i4i.metal",
  "m5.metal",
  "m5d.metal",
  "m5dn.metal",
  "m5n.metal",
  "m5zn.metal",
  "m6a.metal",
  "m6g.metal",
  "m6gd.metal",
  "m6i.metal",
  "m6id.metal",
  "mac1.metal",
  "r5.metal",
  "r5b.metal",
  "r5d.metal",
  "r5dn.metal",
  "r5n.metal",
  "r6a.metal",
  "r6g.metal",
  "r6gd.metal",
  "r6i.metal",
  "r6id.metal",
  "u-6tb1.metal",
  "u-9tb1.metal",
  "u-12tb1.metal",
  "u-18tb1.metal",
  "u-24tb1.metal",
  "x2gd.metal",
  "x2idn.metal",
  "x2iedn.metal",
  "x2iezn.metal",
  "z1d.metal",
];

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
      BurstablePerformance: "included",
      BareMetal: "included",
      ExcludedInstanceTypes: [
        "t2.nano",
        "t2.micro",
        "t2.small",
        "t2.medium",
        "t2.large",
        "t2.xlarge",
        "t2.2xlarge",
        "c3.large",
        "c3.xlarge",
        "c3.2xlarge",
        "c3.4xlarge",
        "c3.8xlarge",
        "r3.large",
        "r3.xlarge",
        "r3.2xlarge",
        "r3.4xlarge",
        "r3.8xlarge",
        "i3.xlarge",
        "i3.2xlarge",
        "i3.4xlarge",
        "i3.8xlarge",
      ],
    },
  } as GetInstanceTypesFromInstanceRequirementsCommandInput);
  let resp = await client.send(command);
  return resp.InstanceTypes.filter((x) => {
    let a = supported_instances.filter((y) => x.InstanceType.includes(y));
    return a.length > 0;
  });
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
  instance_type: string,
  id: string
): Promise<[RunInstancesCommandOutput, CreateKeyPairCommandOutput]> {
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
