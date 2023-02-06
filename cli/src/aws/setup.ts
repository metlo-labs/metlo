import { v4 as uuidv4 } from "uuid"
import chalk from "chalk"
import { prompt } from "enquirer"
import {
  awsMirrorFilterCreation,
  awsMirrorSessionCreation,
  awsMirrorTargetCreation,
  awsSourceIdentification,
  getNetworkIdForInstance,
} from "./setupUtils"
import { AWS_SOURCE_TYPE, Protocols } from "./types"
import { getRegion } from "./cliUtils"
import { getMetloMirrorTargets } from "./sessionUtils"
import { validate } from "uuid"
import { execSync } from "node:child_process"

export const _awsTrafficMirrorSetup = async ({
  id: passedID,
  region: passedRegion,
  target: passedTarget,
  source: passedSource,
}) => {
  let _id, _region, _SourceNetworkEniId, _DestinationNetworkEniId
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
    if (!passedRegion) {
      _region = await getRegion()
    } else {
      _region = passedRegion
    }
    if (!passedSource) {
      const mirrorSourceResp = await prompt([
        {
          type: "select",
          name: "sourceType",
          message: "What type of source do you want to mirror?",
          initial: 1,
          choices: [
            { name: AWS_SOURCE_TYPE.INSTANCE },
            { name: AWS_SOURCE_TYPE.NETWORK_INTERFACE },
          ],
        },
        {
          type: "input",
          name: "mirrorSourceId",
          message: "Enter the id of your source",
        },
      ])
      const sourceType = mirrorSourceResp["sourceType"] as AWS_SOURCE_TYPE
      const mirrorSourceId = (
        mirrorSourceResp["mirrorSourceId"] as string
      ).trim()

      console.log("Finding Source...")
      const { source_eni_id } = await awsSourceIdentification(
        sourceType,
        mirrorSourceId,
        _region,
      )
      _SourceNetworkEniId = source_eni_id
      console.log("Success!")
    } else {
      _SourceNetworkEniId = passedSource
    }

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
    await awsMirrorSessionCreation(
      _region,
      _SourceNetworkEniId,
      mirror_filter_id,
      mirror_target_id,
      _id,
    )
    console.log(chalk.green.bold(`\nSuccess!`))
  }

  const enableCronString =
    `If you want metlo to periodically refresh the mirroring sessions, add this to your crontab on a cloud instance:\n` +
    chalk.bgGray.white(
      `
    $ crontab -e
    $ */5 * * * * ${execSync("command -v metlo").toString().trim()} `.concat(
        `traffic-mirror aws new -t ${_DestinationNetworkEniId} -s ${_SourceNetworkEniId} -r ${_region} -i ${_id}`,
      ),
    )

  console.log(enableCronString)
}

export const awsTrafficMirrorSetup = async ({
  id,
  region,
  targetEniId: target,
  sourceEniId: source,
}) => {
  try {
    await _awsTrafficMirrorSetup({ id, region, target, source })
  } catch (err) {
    console.error(err)
  }
}
