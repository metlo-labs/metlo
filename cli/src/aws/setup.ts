import { v4 as uuidv4 } from "uuid"
import chalk from "chalk"
import { prompt } from "enquirer"
import {
  awsMirrorFilterCreation,
  awsMirrorSessionCreation,
  awsMirrorSessionList,
  awsMirrorTargetCreation,
  getNetworkIdForInstance,
} from "./setupUtils"
import { AWS_SOURCE_TYPE, Protocols } from "./types"
import { getRegion } from "./cliUtils"
import { getMetloMirrorTargets } from "./sessionUtils"
import { validate } from "uuid"
import { execSync } from "node:child_process"
import { EC2_CONN, ECS_CONN, ELB_CONN } from "./ec2Utils"

interface idValueSet {
  eniIds: Array<string>
  originalID: string
}

async function parseSource(props: {
  variant: AWS_SOURCE_TYPE
  region
  existingSourceId?
}): Promise<idValueSet> {
  const { variant, region, existingSourceId } = props
  let stateMetadata = {} as idValueSet
  if (variant === AWS_SOURCE_TYPE.INSTANCE) {
    const ec2Conn = new EC2_CONN(region)
    const instances = (await ec2Conn.describe_instance()).Reservations.flatMap(
      res => res.Instances,
    )
    let instanceId = null
    if (!existingSourceId) {
      const idFetch = await prompt<string>([
        {
          type: "autocomplete",
          name: "mirrorSourceId",
          message: "Select the id of your EC2 Instance",
          choices: instances.map(inst => ({
            name: `${
              inst.Tags
                ? inst.Tags.find(
                    tag => tag.Key === "Name" || tag.Key === "name",
                  )?.Value + ": "
                : ""
            }${inst.InstanceId}`,
            value: inst.InstanceId,
          })),
        },
      ])["mirrorSourceId"]
      instanceId = idFetch
    } else {
      instanceId = existingSourceId
    }
    const currInstance = instances.find(inst => inst.InstanceId === instanceId)
    stateMetadata = {
      eniIds: currInstance.NetworkInterfaces.map(eni => eni.NetworkInterfaceId),
      originalID: currInstance.InstanceId,
    }
    ec2Conn.disconnect()
  } else if (variant === AWS_SOURCE_TYPE.NETWORK_INTERFACE) {
    const ec2Conn = new EC2_CONN(region)
    const interfaces = (await ec2Conn.describe_interface()).NetworkInterfaces
    let networkInterfaceId = null
    if (!existingSourceId) {
      networkInterfaceId = await prompt<string>([
        {
          type: "autocomplete",
          name: "mirrorSourceId",
          message: "Select the id of your Network Interface",
          choices: interfaces.map(inst => ({
            name: inst.NetworkInterfaceId,
          })),
        },
      ])["mirrorSourceId"]
    } else {
      networkInterfaceId = existingSourceId
    }

    const currInterface = interfaces.find(
      iface => iface.NetworkInterfaceId === networkInterfaceId,
    )
    stateMetadata = {
      eniIds: [currInterface.NetworkInterfaceId],
      originalID: currInterface.NetworkInterfaceId,
    }
    ec2Conn.disconnect()
  } else if (variant === AWS_SOURCE_TYPE.ECS) {
    const ecsConn = new ECS_CONN(region)
    let clusterARN = null
    let serviceARN = null
    let clusterName = null
    let serviceName = null
    if (!existingSourceId) {
      const clusters = (await ecsConn.describe_ecs_clusters()).clusters
      const clusterIdSearch = await prompt<string>([
        {
          type: "autocomplete",
          name: "mirrorSourceId",
          message: "Select the id of your ECS cluster",
          choices: clusters.map(cluster => ({
            name: cluster.clusterName,
            value: cluster.clusterArn,
          })),
        },
      ])
      const currCluster = clusters.find(
        cluster => cluster.clusterName === clusterIdSearch["mirrorSourceId"],
      )

      const services = (
        await ecsConn.describe_ecs_services(currCluster.clusterArn)
      ).services
      const secondaryIdFetch = await prompt<string>([
        {
          type: "autocomplete",
          name: "mirrorSourceSecondaryId",
          message: "Select the id of your ECS services",
          choices: services.map(svc => ({
            name: svc.serviceName,
          })),
        },
      ])
      const currService = services.find(
        srvc =>
          srvc.serviceName === secondaryIdFetch["mirrorSourceSecondaryId"],
      )
      clusterARN = currCluster.clusterName
      serviceARN = currService.serviceArn
    } else {
      const [_clusterName, _serviceName] = existingSourceId.split(",")
      clusterName = _clusterName
      serviceName = _serviceName
      const clusters = (await ecsConn.describe_ecs_clusters()).clusters
      const currCluster = clusters.find(
        cluster => cluster.clusterName === clusterName,
      )
      const services = (
        await ecsConn.describe_ecs_services(currCluster.clusterArn)
      ).services
      const currService = services.find(
        srvc => srvc.serviceName === serviceName,
      )
      clusterARN = currCluster.clusterArn
      serviceARN = currService.serviceArn
    }

    const tasks = await ecsConn.describe_ecs_tasks(clusterARN, serviceARN)

    stateMetadata = {
      eniIds: tasks.tasks.map(
        task =>
          task.attachments
            .find(attach => attach.type === "ElasticNetworkInterface")
            ?.details?.find(details => details.name === "networkInterfaceId")
            ?.value,
      ),
      originalID: `${clusterName},${serviceName}`,
    }
    ecsConn.disconnect()
  } else if (variant === AWS_SOURCE_TYPE.ALB) {
    const connElb = new ELB_CONN(region)
    const connEC2 = new EC2_CONN(region)
    const loadBalancerList = (await connElb.list_albs()).LoadBalancers
    let loadBalancerName = null
    if (!existingSourceId) {
      const selectedLB = await prompt<string>([
        {
          type: "autocomplete",
          name: "mirrorSourceId",
          message: "Select the id of your Network Interface",
          choices: loadBalancerList.map(inst => ({
            name: inst.LoadBalancerName,
          })),
        },
      ])
      loadBalancerName = selectedLB["mirrorSourceId"]
    } else {
      loadBalancerName = existingSourceId
    }
    const currLoadBalancer = loadBalancerList.find(
      lb => lb.LoadBalancerName === loadBalancerName,
    )
    const requestedDesc =
      `ELB app/` +
      currLoadBalancer.LoadBalancerName +
      "/" +
      currLoadBalancer.LoadBalancerArn.split("/").at(-1)
    const enis = await connEC2.list_eni([
      {
        Name: "description",
        Values: [requestedDesc],
      },
    ])
    stateMetadata = {
      eniIds: enis.NetworkInterfaces.map(eni => eni.NetworkInterfaceId),
      originalID: currLoadBalancer.LoadBalancerName,
    }
  } else {
    throw new Error(`Invalid source type ${variant}`)
  }
  return stateMetadata
}

export const _awsTrafficMirrorSetup = async ({
  id: passedID,
  region: passedRegion,
  target: passedTarget,
  source: passedSource,
  variant: passedVariant,
}) => {
  let _id: string,
    _region: string,
    _SourceEntityIds: string[],
    _DestinationNetworkEniId: string,
    _variant: AWS_SOURCE_TYPE

  let stateMetadata: idValueSet = null
  {
    // Get a uuid
    {
      if (passedID) {
        if (validate(passedID)) {
          _id = passedID
        } else {
          _id = uuidv4()
        }
      } else {
        _id = uuidv4()
      }
    }
    // List all regions
    {
      if (!passedRegion) {
        _region = await getRegion()
      } else {
        _region = passedRegion
      }
    }
    // Find the type of entity we're creating a session for
    {
      if (passedVariant) {
        _variant = passedVariant
      } else {
        if (passedSource) {
          _variant = AWS_SOURCE_TYPE.NETWORK_INTERFACE
        } else {
          _variant = await prompt([
            {
              type: "select",
              name: "sourceType",
              message: "What type of source do you want to mirror?",
              initial: 1,
              choices: [
                { name: AWS_SOURCE_TYPE.INSTANCE },
                { name: AWS_SOURCE_TYPE.NETWORK_INTERFACE },
                { name: AWS_SOURCE_TYPE.ALB },
                { name: AWS_SOURCE_TYPE.ECS },
              ],
            },
          ])["sourceType"]
        }
      }
    }
    // Find the source IDs
    {
      if (!passedSource) {
        console.log("Finding Source...")
        stateMetadata = await parseSource({
          variant: _variant,
          region: _region,
        })
        _SourceEntityIds = stateMetadata.eniIds
        console.log("Success!")
      } else {
        stateMetadata = await parseSource({
          variant: _variant,
          region: _region,
          existingSourceId: passedSource,
        })
        _SourceEntityIds = stateMetadata.eniIds
      }
    }
    // Get ENI id of metlo mirroring instance
    {
      if (!passedTarget) {
        const mirrorDestinationResp = await prompt([
          {
            type: "input",
            name: "destinationEniId",
            message: "Enter the id of your Metlo Mirroring Instance",
          },
        ])
        const destinationEniId = (
          mirrorDestinationResp["destinationEniId"] as string
        ).trim()
        _DestinationNetworkEniId = await getNetworkIdForInstance(
          _region,
          destinationEniId,
        )
      } else {
        _DestinationNetworkEniId = passedTarget
      }
    }
    // Deduplicate enis for existing sessions
    {
      const existingSessionsForENI = await awsMirrorSessionList(
        _region,
        _SourceEntityIds,
      )
      _SourceEntityIds = _SourceEntityIds.filter(
        eni =>
          !existingSessionsForENI
            .find(session => session.NetworkInterfaceId === eni)
            ?.Tags.find(tag => tag.Key === "metlo-mirror-uuid"),
      )
    }
    // Create Mirroring things
    {
      console.log("Creating Mirror Session...")
      const targets = await getMetloMirrorTargets(_region)
      let mirror_target_id = targets.find(
        e => e.NetworkInterfaceId == _DestinationNetworkEniId,
      )?.TrafficMirrorTargetId

      if (!mirror_target_id) {
        const targetCreateResp = await awsMirrorTargetCreation(
          _region,
          _DestinationNetworkEniId,
          _id,
        )
        mirror_target_id = targetCreateResp.mirror_target_id
      }

      // Create Mirror Filter
      const { mirror_filter_id } = await awsMirrorFilterCreation(
        _region,
        [
          {
            destination_CIDR: "0.0.0.0/0",
            source_CIDR: "0.0.0.0/0",
            destination_port: "",
            source_port: "",
            direction: "in",
            protocol: Protocols.TCP,
          },
          {
            destination_CIDR: "0.0.0.0/0",
            source_CIDR: "0.0.0.0/0",
            destination_port: "",
            source_port: "",
            direction: "out",
            protocol: Protocols.TCP,
          },
        ],
        _id,
      )

      for (const srcEniID of _SourceEntityIds) {
        await awsMirrorSessionCreation(
          _region,
          srcEniID,
          mirror_filter_id,
          mirror_target_id,
          _id,
        )
      }
      console.log(chalk.green.bold(`\nSuccess!`))
    }
  }

  //TODO Fix CRON
  const metloCmdLoc = execSync("command -v metlo").toString().trim()
  let cmd = `traffic-mirror aws new --target-eni-id ${_DestinationNetworkEniId} --source-id "${stateMetadata.originalID}" --region "${_region}" -i ${_id} --variant "${_variant}" `

  const enableCronString =
    `If you want metlo to periodically refresh the mirroring sessions, add this to your crontab on a cloud instance:\n` +
    chalk.bgGray.white(
      `
    $ crontab -e
    $ */5 * * * * ${metloCmdLoc} `.concat(cmd),
    )

  console.log(enableCronString)
}

export const awsTrafficMirrorSetup = async ({
  id,
  region,
  targetEniId: target,
  sourceId: source,
  variant,
}) => {
  try {
    await _awsTrafficMirrorSetup({
      id,
      region,
      target,
      source,
      variant,
    })
  } catch (err) {
    console.error(err)
  }
}
