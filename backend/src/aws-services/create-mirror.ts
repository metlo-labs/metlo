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
} from "@aws-sdk/client-ec2";

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