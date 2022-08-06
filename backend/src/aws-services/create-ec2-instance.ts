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
  Image,
} from "@aws-sdk/client-ec2";
import { Config } from "aws-sdk";
import { response } from "express";

interface MachineSpecifications {
  minCpu: number;
  maxCpu: number;
  minMem: number;
  maxMem?: number;
}

async function get_all_images(
  img_names: Array<string>,
  config: EC2ClientConfig
): Promise<Array<Image>> {
  // Create anAmazon EC2 service client object.
  const ec2Client = new EC2Client(config);
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

async function get_latest_image(
  config: EC2ClientConfig,
  img_names: Array<string> = [
    "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-????????",
  ]
) {
  let resp = (await get_all_images(img_names, config)).pop();
  console.log(resp);
  return resp;
}

async function get_valid_types(
  config: EC2ClientConfig,
  image: Image,
  specs: MachineSpecifications
): Promise<Array<InstanceTypeInfoFromInstanceRequirements>> {
  let client = new EC2Client(config);
  let command = new GetInstanceTypesFromInstanceRequirementsCommand({
    ArchitectureTypes: ["x86_64"],
    VirtualizationTypes: [image.VirtualizationType],
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

async function describe_type(config: EC2ClientConfig, InstanceType: string) {
  let client = new EC2Client(config);
  let command = new DescribeInstanceTypesCommand({
    InstanceTypes: [InstanceType],
  } as DescribeInstanceTypesCommandInput);
  let resp = await client.send(command);
  return resp.InstanceTypes[0];
}