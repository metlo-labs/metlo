import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import { prompt } from "enquirer"
import { GCP_REGIONS_SUPPORTED } from "./gcpUtils"
import { GCP_CONN } from "./gcp_apis"
import chalk from "chalk"
import ora from "ora";
import { Table } from "console-table-printer"

const spinner = ora()

const verifyAccountDetails = async () => {
    const gcp_regions = GCP_REGIONS_SUPPORTED.map(e => ({
        name: e,
    }))
    const resp = await prompt([
        {
            type: "input",
            name: "_projectName",
            message: "GCP Project Name",
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

const listPacketMirroring = async (conn: GCP_CONN, zone: string) => {
    const p = new Table({
        columns: [
            { name: "packetMirror", alignment: "left", title: "Packet Mirror" },
            { name: "type", alignment: "left", title: "Mirror Type" },
            { name: "source", alignment: "left", title: "Mirror Source" },
        ],
    })
    const [resp] = await conn.list_packet_mirroring()
    resp.forEach((mirror) => {
        mirror.mirroredResources.instances.forEach(inst => {
            const instanceName = inst.url.split("/")
            const instanceUrl = `https://console.cloud.google.com/compute/instancesDetail/zones/${zone}/instances/${instanceName[instanceName.length - 1]}`
            p.addRow({ packetMirror: mirror.name, type: "Instance", source: instanceUrl })
        })
        mirror.mirroredResources.subnetworks.forEach(inst => {
            const instanceName = inst.url.split("/")
            const instanceUrl = `https://console.cloud.google.com/networking/subnetworks/details/${zone}/${instanceName[instanceName.length - 1]}`
            p.addRow({ packetMirror: mirror.name, type: "Subnet", source: instanceUrl })
        })
        mirror.mirroredResources.tags.forEach(inst => p.addRow({ packetMirror: mirror.name, type: "Tag", source: inst }))
    })

    console.log(chalk.bold("\n Metlo Mirroring Sessions"))
    p.printTable()
}

const imageURL = "https://www.googleapis.com/compute/v1/projects/metlo-security/global/images/metlo-ingestor-v2"

export const gcpTrafficMirrorList = async () => {
    const id = uuidv4()
    const data = {}
    try {
        const { project, zone, network, key } = await verifyAccountDetails()
        const networkUrl = `https://www.googleapis.com/compute/v1/projects/${project}/global/networks/${network}`
        const conn = new GCP_CONN(key, zone, project);        
        data["zone"] = zone
        data["project"] = project

        const { } = await listPacketMirroring(conn, zone)
    } catch (e) {
        spinner.fail()
        console.log(chalk.bgRedBright("Metlo packet mirroring list failed. This might help in debugging it."))
        console.log(e)
        console.log(data)
    }
}
