import {
  DescribeNetworkInterfacesCommand,
  DescribeTrafficMirrorFiltersCommand,
  DescribeTrafficMirrorSessionsCommand,
  DescribeTrafficMirrorTargetsCommand,
  NetworkInterface,
  TrafficMirrorFilter,
  TrafficMirrorTarget,
} from "@aws-sdk/client-ec2"
import { getEC2Client } from "./ec2Utils"
import { Table } from "console-table-printer"
import chalk from "chalk"

interface MirrorItem {
  sessionID: string
  targetID: string
  filterID: string
  networkInterfaceID: string
  networkInterfaceInfo: NetworkInterface
  filter: TrafficMirrorFilter
  target: TrafficMirrorTarget
}

export const getMetloMirrorTargets = async (region?: string) => {
  const client = getEC2Client(region)
  const targetsResp = await client.send(
    new DescribeTrafficMirrorTargetsCommand({
      MaxResults: 1000,
    }),
  )
  const targets = targetsResp.TrafficMirrorTargets.filter(
    e => e.Tags.find(t => t.Key == "service-name")?.Value == "metlo",
  )
  client.destroy()
  return targets
}

export const getMetloMirrorSessions = async (region?: string) => {
  const client = getEC2Client(region)
  const sessionCommand = new DescribeTrafficMirrorSessionsCommand({
    MaxResults: 1000,
  })
  const filterCommand = new DescribeTrafficMirrorFiltersCommand({
    MaxResults: 1000,
  })
  const [sessionsResp, filtersResp] = await Promise.all([
    client.send(sessionCommand),
    client.send(filterCommand),
  ])
  const sessions = sessionsResp.TrafficMirrorSessions.filter(
    e => e.Tags.find(t => t.Key == "service-name")?.Value == "metlo",
  )
  const filters = filtersResp.TrafficMirrorFilters.filter(
    e => e.Tags.find(t => t.Key == "service-name")?.Value == "metlo",
  )
  const networkInterfaceInfo = await client.send(
    new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: sessions.map(e => e.NetworkInterfaceId),
    }),
  )
  client.destroy()

  const targets = await getMetloMirrorTargets(region)
  const filterMap = Object.fromEntries(
    filters.map(e => [e.TrafficMirrorFilterId, e]),
  )
  const targetMap = Object.fromEntries(
    targets.map(e => [e.TrafficMirrorTargetId, e]),
  )
  const networkInterfaceMap = Object.fromEntries(
    networkInterfaceInfo.NetworkInterfaces.map(e => [e.NetworkInterfaceId, e]),
  )

  return sessions.map(e => ({
    sessionID: e.TrafficMirrorSessionId,
    targetID: e.TrafficMirrorTargetId,
    filterID: e.TrafficMirrorFilterId,
    networkInterfaceID: e.NetworkInterfaceId,
    networkInterfaceInfo: networkInterfaceMap[e.NetworkInterfaceId],
    filter: filterMap[e.TrafficMirrorFilterId],
    target: targetMap[e.TrafficMirrorTargetId],
  }))
}

export const printMetloMirrorSessions = (
  region: string,
  trafficMirrorSessions: MirrorItem[],
) => {
  const p = new Table({
    columns: [
      { name: "sessionID", alignment: "left" },
      { name: "type", alignment: "left" },
      { name: "source", alignment: "left" },
    ],
  })
  p.addRows(
    trafficMirrorSessions.map(e => {
      let sourceType = ""
      let sourceText = ""
      if (e.networkInterfaceInfo.Attachment.InstanceId) {
        sourceType = "instance"
        sourceText = `https://${region}.console.aws.amazon.com/ec2/home#InstanceDetails:instanceId=${e.networkInterfaceInfo.Attachment.InstanceId}`
      } else {
        sourceType = "network-interface"
        sourceText = `https://us-west-2.console.aws.amazon.com/ec2/home#NetworkInterface:networkInterfaceId=${e.networkInterfaceID}`
      }
      return {
        sessionID: e.sessionID,
        type: sourceType,
        source: sourceText,
      }
    }),
  )
  console.log(chalk.bold("\n Metlo Mirroring Sessions"))
  p.printTable()
}
