import {
  DescribeNetworkInterfacesCommand,
  DescribeNetworkInterfacesCommandInput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
  NetworkInterface,
  DescribeInstancesCommandOutput,
} from "@aws-sdk/client-ec2";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generate_random_string(length) {
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export async function get_network_interface_from_vpc_id(
  client: EC2Client,
  vpc_id: string
): Promise<Array<NetworkInterface>> {
  let command = new DescribeNetworkInterfacesCommand({
    Filters: [{ Name: "vpc_id", Values: [vpc_id] }],
  } as DescribeNetworkInterfacesCommandInput);
  return await (
    await client.send(command)
  ).NetworkInterfaces;
}

export async function list_all_network_interfaces(
  client: EC2Client
): Promise<Array<NetworkInterface>> {
  let command = new DescribeNetworkInterfacesCommand({
    MaxResults: 1000,
  } as DescribeNetworkInterfacesCommandInput);
  return await (
    await client.send(command)
  ).NetworkInterfaces;
}
export async function list_all_instances(
  client: EC2Client
): Promise<DescribeInstancesCommandOutput> {
  let command = new DescribeInstancesCommand({
    MaxResults: 1000,
  } as DescribeInstancesCommandInput);
  return await client.send(command);
}
