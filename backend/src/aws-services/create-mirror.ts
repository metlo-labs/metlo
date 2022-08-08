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
import { randomUUID } from "crypto";

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

async function create_mirror_target(
  client: EC2Client,
  network_interface_id: string,
  unique_id: string
) {
  let command = new CreateTrafficMirrorTargetCommand({
    NetworkInterfaceId: network_interface_id,
    ClientToken: unique_id,
  } as CreateTrafficMirrorTargetCommandInput);
  return await client.send(command);
}

async function create_mirror_filter(client: EC2Client, unique_id: string) {
  let command = new CreateTrafficMirrorFilterCommand({
    ClientToken: unique_id,
    TagSpecifications: [
      {
        ResourceType: "traffic-mirror-filter",
        Tags: [{ Key: "Name", Value: `${unique_id}` }],
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
    let command = new CreateTrafficMirrorFilterRuleCommand({
      ClientToken: unique_id,
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
