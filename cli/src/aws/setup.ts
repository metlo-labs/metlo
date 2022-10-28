import { v4 as uuidv4 } from "uuid"
import { prompt } from "enquirer"
import {
  awsKeySetup,
  awsMirrorFilterCreation,
  awsMirrorSessionCreation,
  awsMirrorTargetCreation,
  awsSourceIdentification,
  getNetworkIdForInstance,
} from "./setupUtils"
import { AWS_SOURCE_TYPE, Protocols } from "./types"
import { AWS_REGIONS } from "./constants"

const getAWSKeys = async (_region: string) => {
  try {
    const awsKeyResp = await prompt([
      {
        type: "input",
        name: "accessID",
        message: "Enter your AWS Access Key ID",
      },
      {
        type: "password",
        name: "key",
        message: "Enter your AWS Secret Access Key",
      },
    ])
    const accessID = (awsKeyResp["accessID"] as string).trim()
    const secretAccessKey = (awsKeyResp["key"] as string).trim()
    console.log("Verifying Keys...")
    await awsKeySetup(accessID, secretAccessKey, _region)
    console.log("Success!")
    return {
      accessID,
      secretAccessKey,
    }
  } catch (e) {
    console.error(e)
    return getAWSKeys(_region)
  }
}

export const awsTrafficMirrorSetup = async () => {
  const id = uuidv4()
  try {
    const regionResp = await prompt([
      {
        type: "select",
        name: "_region",
        message: "Select your AWS region",
        initial: 1,
        choices: AWS_REGIONS.map(e => ({
          name: e,
        })),
      },
    ])
    const _region = regionResp["_region"] as string

    const { accessID, secretAccessKey } = await getAWSKeys(_region)

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
      accessID,
      secretAccessKey,
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
      accessID,
      secretAccessKey,
      region,
      destinationEniId,
    )

    console.log("Creating Mirror Session...")
    const { mirror_target_id } = await awsMirrorTargetCreation(
      accessID,
      secretAccessKey,
      region,
      destinationNetworkEniID,
      id,
    )
    const { mirror_filter_id } = await awsMirrorFilterCreation(
      accessID,
      secretAccessKey,
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
      accessID,
      secretAccessKey,
      region,
      source_eni_id,
      mirror_filter_id,
      mirror_target_id,
      id,
    )
    console.log("Success!")
  } catch (e) {
    console.error(e)
  }
}
