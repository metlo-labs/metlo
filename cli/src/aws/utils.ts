import {
  DescribeNetworkInterfacesCommand,
  DescribeNetworkInterfacesCommandInput,
  DescribeInstancesCommand,
  DescribeInstancesCommandInput,
  EC2Client,
  NetworkInterface,
  DescribeInstancesCommandOutput,
  DescribeRegionsCommand,
  DescribeRegionsCommandInput,
} from "@aws-sdk/client-ec2"
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export function generate_random_string(length) {
  let result = " "
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export async function get_network_interface_from_vpc_id(
  client: EC2Client,
  vpc_id: string,
): Promise<Array<NetworkInterface>> {
  let command = new DescribeNetworkInterfacesCommand({
    Filters: [{ Name: "vpc_id", Values: [vpc_id] }],
  } as DescribeNetworkInterfacesCommandInput)
  return await (
    await client.send(command)
  ).NetworkInterfaces
}

export async function list_all_network_interfaces(
  client: EC2Client,
): Promise<Array<NetworkInterface>> {
  let command = new DescribeNetworkInterfacesCommand({
    MaxResults: 1000,
  } as DescribeNetworkInterfacesCommandInput)
  return await (
    await client.send(command)
  ).NetworkInterfaces
}

export async function list_all_instances(
  client: EC2Client,
): Promise<DescribeInstancesCommandOutput> {
  let command = new DescribeInstancesCommand({
    MaxResults: 1000,
  } as DescribeInstancesCommandInput)
  return await client.send(command)
}

export async function get_network_id_for_instance(
  client: EC2Client,
  instance_id,
) {
  let command = new DescribeInstancesCommand({
    InstanceIds: [instance_id],
  } as DescribeInstancesCommandInput)
  return await (
    await client.send(command)
  ).Reservations[0].Instances[0].NetworkInterfaces[0].NetworkInterfaceId
}

export async function get_region_for_instance(client: EC2Client, instance_id) {
  let command = new DescribeInstancesCommand({
    MaxResults: 1,
    InstanceIds: [instance_id],
  } as DescribeInstancesCommandInput)
  return (await client.send(command)).Reservations[0].Instances[0].Placement
    .AvailabilityZone
}

export async function get_region_for_network_interface(
  client: EC2Client,
  interface_id,
) {
  let command = new DescribeNetworkInterfacesCommand({
    MaxResults: 1,
    NetworkInterfaceIds: [interface_id],
  } as DescribeNetworkInterfacesCommandInput)
  return (await client.send(command)).NetworkInterfaces[0].AvailabilityZone
}

export async function describe_regions(client: EC2Client) {
  let command = new DescribeRegionsCommand({
    AllRegions: true,
  } as DescribeRegionsCommandInput)
  return await client.send(command)
}

export async function match_av_to_region(
  client: EC2Client,
  availability_zone: string,
) {
  let regions = await describe_regions(client)
  return regions.Regions.find(v => availability_zone.includes(v.RegionName))
}

export async function verifyIdentity(client: STSClient) {
  await client.send(new GetCallerIdentityCommand({}))
}

export function retry(fn: Function) {
  return async args => {
    var resp, error
    var idx = 0
    for (idx = 0; idx < 5; idx++) {
      try {
        resp = await fn(...args)
        break
      } catch (err) {
        error = err
      }
    }
    if (idx === 5 && error) {
      throw error
    }
    return resp
  }
}
