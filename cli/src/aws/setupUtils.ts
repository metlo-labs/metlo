import {
  CreateTrafficMirrorFilterCommandOutput,
  DescribeInstancesCommandInput,
  DescribeInstancesCommand,
  EC2Client,
} from "@aws-sdk/client-ec2"
import { STSClient } from "@aws-sdk/client-sts"
import {
  create_mirror_filter,
  create_mirror_filter_rules,
  create_mirror_session,
  create_mirror_target,
  delete_mirror_filter,
} from "./mirroring"
import { match_av_to_region, verifyIdentity } from "./utils"
import { EC2_CONN } from "./ec2Utils"

import { AWS_SOURCE_TYPE, TrafficFilterRuleSpecs } from "./types"

export const awsKeySetup = async (
  access_id: string,
  secret_access_key: string,
  region: string,
) => {
  let client = new STSClient({
    credentials: {
      accessKeyId: access_id,
      secretAccessKey: secret_access_key,
    },
    region,
  })
  await verifyIdentity(client)
  client.destroy()
}

export async function getNetworkIdForInstance(
  access_id: string,
  secret_access_key: string,
  region: string,
  instance_id: string,
) {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  })
  let command = new DescribeInstancesCommand({
    InstanceIds: [instance_id],
  } as DescribeInstancesCommandInput)
  const resp = await await client.send(command)
  client.destroy()
  return resp.Reservations[0].Instances[0].NetworkInterfaces[0]
    .NetworkInterfaceId
}

export const awsSourceIdentification = async (
  access_id: string,
  secret_access_key: string,
  source_type: AWS_SOURCE_TYPE,
  mirror_source_id: string,
  _region: string,
) => {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  })

  let ec2_conn = new EC2_CONN(access_id, secret_access_key, _region)
  let all_valid_types = await ec2_conn.get_valid_types(undefined, undefined)

  var region, source_eni_id, source_private_ip, instance_type, isValid
  if (source_type === AWS_SOURCE_TYPE.INSTANCE) {
    let resp = await ec2_conn.describe_instance(mirror_source_id)

    instance_type = resp.Reservations[0].Instances[0].InstanceType
    if (!all_valid_types.map(v => v.InstanceType).includes(instance_type)) {
      throw new Error(
        `AWS EC2 instance type ${instance_type} does not support mirroring traffic. ` +
        `Supported instances listed at https://aws.amazon.com/about-aws/whats-new/2021/02/amazon-vpc-traffic-mirroring-supported-select-non-nitro-instance-types/`,
      )
    }
    region = await match_av_to_region(
      client,
      resp.Reservations[0].Instances[0].Placement.AvailabilityZone,
    )
    source_eni_id =
      resp.Reservations[0].Instances[0].NetworkInterfaces[0].NetworkInterfaceId
    source_private_ip =
      resp.Reservations[0].Instances[0].NetworkInterfaces[0].PrivateIpAddress
  } else if (source_type === AWS_SOURCE_TYPE.NETWORK_INTERFACE) {
    let resp = await ec2_conn.describe_interface(mirror_source_id)
    if (resp.NetworkInterfaces[0].Attachment.InstanceId) {
      let instance_type_resp = await ec2_conn.describe_instance(
        resp.NetworkInterfaces[0].Attachment.InstanceId,
      )

      instance_type = instance_type_resp.Reservations[0].Instances[0].InstanceType
      if (!all_valid_types.map(v => v.InstanceType).includes(instance_type)) {
        throw new Error(
          `AWS EC2 instance type ${instance_type} does not support mirroring traffic. ` +
          `Supported instances listed at https://aws.amazon.com/about-aws/whats-new/2021/02/amazon-vpc-traffic-mirroring-supported-select-non-nitro-instance-types/`,
        )
      }
    } else {
      console.log("Couldn't locate an attached EC2 instance. Moving forward assuming valid instance")
    }

    region = await match_av_to_region(
      client,
      resp.NetworkInterfaces[0].AvailabilityZone,
    )
    source_eni_id = resp.NetworkInterfaces[0].NetworkInterfaceId
    source_private_ip = resp.NetworkInterfaces[0].PrivateIpAddress
  } else {
    throw new Error(
      `Couldn't find information about source_type : ${source_type}`,
    )
  }

  client.destroy()
  return {
    mirror_source_id,
    source_type,
    region: region.RegionName,
    source_eni_id: source_eni_id,
    source_private_ip: source_private_ip,
  }
}

export const awsMirrorTargetCreation = async (
  access_id: string,
  secret_access_key: string,
  region: string,
  destination_eni_id: string,
  id: string,
) => {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  })
  let resp = await create_mirror_target(client, destination_eni_id, id)
  client.destroy()
  return {
    mirror_target_id: resp.TrafficMirrorTarget.TrafficMirrorTargetId,
  }
}

export const awsMirrorFilterCreation = async (
  access_id: string,
  secret_access_key: string,
  region: string,
  mirror_rules: Array<TrafficFilterRuleSpecs>,
  id: string,
) => {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  })
  let filter: CreateTrafficMirrorFilterCommandOutput
  filter = await create_mirror_filter(client, id)
  try {
    let _ = await create_mirror_filter_rules(
      client,
      id,
      mirror_rules,
      filter.TrafficMirrorFilter.TrafficMirrorFilterId,
    )
    client.destroy()
    return {
      mirror_filter_id: filter.TrafficMirrorFilter.TrafficMirrorFilterId,
    }
  } catch (err) {
    await delete_mirror_filter(
      client,
      filter.TrafficMirrorFilter.TrafficMirrorFilterId,
      id,
    )
    throw err
  }
}

export const awsMirrorSessionCreation = async (
  access_id: string,
  secret_access_key: string,
  region: string,
  source_eni_id: string,
  mirror_filter_id: string,
  mirror_target_id: string,
  id: string,
) => {
  let client = new EC2Client({
    credentials: {
      secretAccessKey: secret_access_key,
      accessKeyId: access_id,
    },
    region: region,
  })
  let resp = await create_mirror_session(
    client,
    id,
    source_eni_id,
    mirror_filter_id,
    mirror_target_id,
  )
  client.destroy()
  return {
    mirror_session_id: resp.TrafficMirrorSession.TrafficMirrorSessionId,
  }
}
