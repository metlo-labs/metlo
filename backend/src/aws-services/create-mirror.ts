import {
  CreateTrafficMirrorFilterCommand,
  CreateTrafficMirrorFilterCommandInput,
  CreateTrafficMirrorTargetCommand,
  CreateTrafficMirrorTargetCommandInput,
  CreateTrafficMirrorFilterRuleCommand,
  CreateTrafficMirrorFilterRuleCommandInput,
  CreateTrafficMirrorSessionCommand,
  CreateTrafficMirrorSessionCommandInput,
  EC2Client,
  TrafficMirrorFilterRule,
  TagSpecification,
} from "@aws-sdk/client-ec2";
import { createHash, Hash, randomUUID } from "crypto";

export enum protocols {
  TCP = 6,
  UDP = 17,
}

export interface TrafficFilterRuleSpecs {
  destination_CIDR: string;
  source_CIDR: string;
  source_port?: string;
  destination_port?: string;
  protocol: protocols;
  direction: "out" | "in";
}

export async function create_mirror_target(
  client: EC2Client,
  network_interface_id: string,
  unique_id: string
) {
  let command = new CreateTrafficMirrorTargetCommand({
    NetworkInterfaceId: network_interface_id,
    ClientToken: network_interface_id,
    TagSpecifications: [
      {
        ResourceType: "traffic-mirror-target",
        Tags: [{ Key: "Name", Value: `METLO-TRAFFIC-TARGET-${unique_id}` }],
      },
    ],
  } as CreateTrafficMirrorTargetCommandInput);
  return await client.send(command);
}

export async function create_mirror_filter(
  client: EC2Client,
  unique_id: string
) {
  let command = new CreateTrafficMirrorFilterCommand({
    ClientToken: unique_id,
    TagSpecifications: [
      {
        ResourceType: "traffic-mirror-filter",
        Tags: [{ Key: "Name", Value: `METLO-MIRROR-FILTER-${unique_id}` }],
      },
    ],
  } as CreateTrafficMirrorFilterCommandInput);
  return await client.send(command);
}

export async function create_mirror_filter_rules(
  client: EC2Client,
  unique_id: string,
  filter_rules: Array<TrafficFilterRuleSpecs>,
  filter: TrafficMirrorFilterRule
) {
  let command_resps = [];
  for (const v of filter_rules) {
    let hash = createHash("sha256");
    hash.update(unique_id);
    hash.update(JSON.stringify(filter_rules));
    let hash_str = hash.digest("base64").toString();
    console.log(hash_str);

    let command = new CreateTrafficMirrorFilterRuleCommand({
      ClientToken: hash_str,
      TrafficDirection: v.direction === "out" ? "ingress" : "egress",
      RuleNumber: 100,
      SourceCidrBlock: v.source_CIDR,
      DestinationCidrBlock: v.destination_CIDR,
      DestinationPortRange: v.destination_port,
      SourcePortRange: v.source_port,
      Protocol: v.protocol,
      RuleAction: "accept",
      TrafficMirrorFilterId: filter.TrafficMirrorFilterId,
    } as CreateTrafficMirrorFilterRuleCommandInput);
    let resp = client.send(command);
    command_resps.push(resp);
  }
  return await Promise.all(command_resps);
}

export async function create_mirror_session(
  client: EC2Client,
  unique_id: string,
  network_instance_id: string,
  filter_id: string,
  target_id: string
) {
  let command = new CreateTrafficMirrorSessionCommand({
    SessionNumber: 1,
    NetworkInterfaceId: network_instance_id,
    TrafficMirrorFilterId: filter_id,
    TrafficMirrorTargetId: target_id,
    TagSpecifications: [
      {
        ResourceType: "traffic-mirror-session",
        Tags: [{ Key: "Name", Value: `METLO-MIRROR-SESSION-${unique_id}` }],
      },
    ],
  } as CreateTrafficMirrorSessionCommandInput);
  return await client.send(command);
}
