import {
  EC2Client,
  DescribeImagesCommand,
  DescribeImagesCommandInput,
  DescribeImagesCommandOutput,
  Filter,
  EC2ClientConfig,
} from "@aws-sdk/client-ec2";
import { Config } from "aws-sdk";
import { response } from "express";
// Set the AWS Region.
// TODO : Get info from params

async function get_all_images(
  img_names: Array<string>,
  config: EC2ClientConfig
): Promise<DescribeImagesCommandOutput["Images"]> {
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
