import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import { prompt } from "enquirer"
import { GCP_REGIONS_SUPPORTED } from "./gcpUtils"
import { GCP_CONN } from "./gcp_apis"
import chalk from "chalk"
import ora from "ora";
import { google } from "@google-cloud/compute/build/protos/protos"

const spinner = ora()

const verifyAccountDetails = async () => {
    const gcp_regions = GCP_REGIONS_SUPPORTED.map(e => ({
        name: e,
    }))
    const resp = await prompt([
        {
            type: "input",
            name: "_projectName",
            message: "GCP Project ID",
        }, {
            type: "input",
            initial: "default",
            name: "_networkName",
            message: "GCP Network to mirror",
        }, {
            type: "autocomplete",
            name: "_zoneName",
            message: "Select your GCP zone",
            initial: 1,
            choices: gcp_regions,
        }, {
            type: "input",
            name: "_keyPath",
            message: "Path to GCP key file",
            validate: (path: string) => {
                if (fs.existsSync(path)) {
                    return true
                } else {
                    // @ts-ignore
                    let text = chalk.redBright(`GCP Key file not found at ${path}`)
                    return text
                }
            }
        }
    ])

    spinner.text = "Validating account details"
    spinner.start()
    // @ts-ignore Destructuring is improperly done
    const { _projectName: project, _networkName: network, _zoneName: zone, _keyPath: keyFilePath } = resp;

    const key = (fs.readFileSync(keyFilePath)).toString("utf-8");

    let conn = new GCP_CONN(key, zone, project)
    await conn.test_connection()
    await conn.get_zone({ zone })
    spinner.succeed("Validated account details")
    spinner.stop()
    spinner.clear()
    return { project, network, zone, key }
}


const deletePacketMirroringResources = async (
    conn: GCP_CONN,
    mirroring: google.cloud.compute.v1.IPacketMirroring[]
) => {
    if (mirroring.length == 0) {
        throw new Error("No existing packet mirroring instances found")
    }

    const instanceChoices = mirroring.flatMap(
        (mirror) => mirror.mirroredResources.instances.map(
            inst => {
                const splits = inst.url.split("/");
                return splits[splits.length - 1]
            }
        )
    )
    const subnetChoices = mirroring.flatMap(
        (mirror) => mirror.mirroredResources.subnetworks.map(
            inst => {
                const splits = inst.url.split("/");
                return splits[splits.length - 1]
            }
        )
    )
    const tagChoices = mirroring.flatMap(
        (mirror) => mirror.mirroredResources.tags
    )

    const availableChoices = []
    if (instanceChoices.length > 0) {
        availableChoices.push("INSTANCE")
    }
    if (subnetChoices.length > 0) {
        availableChoices.push("SUBNET")
    }
    if (tagChoices.length > 0) {
        availableChoices.push("TAG")
    }

    const sourceTypeResp = await prompt([
        {
            type: "autocomplete",
            name: "_packetMirrorName",
            message: "Select Packet Mirroring instance",
            initial: 0,
            choices: mirroring.filter((inst) => inst.name.startsWith("metlo")).map((inst) => inst.name)
        }, {
            type: "select",
            name: "_sourceType",
            message: "Select your mirror source type",
            initial: 0,
            choices: availableChoices,
        },
    ])
    let sourceType = sourceTypeResp["_sourceType"]
    let packetMirrorName = sourceTypeResp["_packetMirrorName"]

    if (sourceType === "INSTANCE") {
        const instanceNameResp = await prompt([
            {
                type: "autocomplete",
                name: "_name",
                message: "Enter the mirror source instance name to remove",
                choices: instanceChoices

            }
        ])
        spinner.start("Verifying mirror source details")
        const instanceName = instanceNameResp['_name'].trim()

        const resources = mirroring.find((mirror) => mirror.name === packetMirrorName).mirroredResources
        resources.instances = resources.instances.filter((inst) => !inst.url.includes(instanceName))

        let resp = await conn.remove_packet_mirroring_resources({ packetMirrorName, newMirroredResources: resources })
    } else if (sourceType === "SUBNET") {
        const subnetNameResp = await prompt([
            {
                type: "autocomplete",
                name: "_name",
                message: "Enter the mirror source subnet name to remove",
                choices: subnetChoices
            }
        ])
        spinner.start("Verifying mirror source details")
        const subnetName = subnetNameResp['_name'].trim()

        const resources = mirroring.find((mirror) => mirror.name === packetMirrorName).mirroredResources
        resources.subnetworks = resources.subnetworks.filter((inst) => !inst.url.includes(subnetName))

        let resp = await conn.remove_packet_mirroring_resources({ packetMirrorName, newMirroredResources: resources })
    } else if (sourceType === "TAG") {
        const tagNameResp = await prompt([
            {
                type: "autocomplete",
                name: "_name",
                message: "Enter the mirror source tag name to remove",
                choices: tagChoices
            }
        ])
        spinner.start("Verifying mirror source details")
        let tagName = tagNameResp["_name"].trim()

        const resources = mirroring.find((mirror) => mirror.name === packetMirrorName).mirroredResources
        resources.tags = resources.tags.filter((inst) => !inst.includes(tagName))

        let resp = await conn.remove_packet_mirroring_resources({ packetMirrorName, newMirroredResources: resources })
    }
    spinner.succeed("Deleted resource from packet mirroring Succesfully")
    spinner.stop()
    spinner.clear()
    return {}
}

export const gcpTrafficMirrorDelete = async () => {
    const id = uuidv4()
    const data = {}
    try {
        const { project, zone, network, key } = await verifyAccountDetails()
        const networkUrl = `https://www.googleapis.com/compute/v1/projects/${project}/global/networks/${network}`
        const conn = new GCP_CONN(key, zone, project);
        data["zone"] = zone
        data["project"] = project

        let [packetMirrors] = await conn.list_packet_mirroring()
        packetMirrors = packetMirrors.filter(mirror => mirror.network.url == networkUrl)

        await deletePacketMirroringResources(conn, packetMirrors)
    } catch (e) {
        spinner.fail()
        console.log(chalk.bgRedBright("Metlo packet mirroring item removal failed. This might help in debugging it."))
        console.log(e)
        console.log(data)
    }
}
