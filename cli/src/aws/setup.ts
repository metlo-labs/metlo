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

export const awsTrafficMirrorSetup = async () => {
  const id = uuidv4()
  try {
    const _region = await getRegion()
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
    const mirrorSourceId = (mirrorSourceResp["mirrorSourceId"] as string).trim()

    console.log("Finding Source...")
    const { source_eni_id, region } = await awsSourceIdentification(
      sourceType,
      mirrorSourceId,
      _region,
    )
    console.log("Success!")

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
    const destinationNetworkEniID = await getNetworkIdForInstance(
      region,
      destinationEniId,
    )

    console.log("Creating Mirror Session...")
    const targets = await getMetloMirrorTargets(region)
    let mirror_target_id = targets.find(
      e => e.NetworkInterfaceId == destinationNetworkEniID,
    )?.TrafficMirrorTargetId
    if (!mirror_target_id) {
      const targetCreateResp = await awsMirrorTargetCreation(
        region,
        destinationNetworkEniID,
        id,
      )
      mirror_target_id = targetCreateResp.mirror_target_id
    }
    const { mirror_filter_id } = await awsMirrorFilterCreation(
      region,
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
      id,
    )
    await awsMirrorSessionCreation(
      region,
      source_eni_id,
      mirror_filter_id,
      mirror_target_id,
      id,
    )
    console.log(chalk.green.bold(`\nSuccess!`))
  } catch (e) {
    console.error(e)
  }
}
