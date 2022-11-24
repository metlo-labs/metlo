import { v4 as uuidv4, validate } from "uuid"
import fs from "fs"
import { prompt } from "enquirer"
import { GCP_REGIONS_SUPPORTED, wait_for_global_operation, wait_for_regional_operation, wait_for_zonal_operation } from "./gcpUtils"
import { GCP_CONN } from "./gcp_apis"
import chalk from "chalk"
import ora from "ora";
import assert from "node:assert"

const spinner = ora()

export async function cleanupGCP(
    conn: GCP_CONN,
    zone: string,
    project: string,
    networkUrl: string
) {
    const region = zone.substring(0, zone.length - 2)
    let [mirroring] = await conn.list_packet_mirroring()
    mirroring = mirroring
        .filter(mirror => mirror.network.url == networkUrl)
        .filter((mirror) => mirror.name.startsWith("metlo"))
    if (mirroring.length == 0) {
        throw new Error("No existing packet mirroring instances found")
    }

    const identifySourceResp = await prompt([
        {
            type: "autocomplete",
            name: "_packetMirrorName",
            message: "Select Packet Mirroring instance",
            initial: 0,
            choices: mirroring.map((inst) => inst.name)
        }]
    )
    let packetMirrorName = identifySourceResp["_packetMirrorName"]
    let mirrorInstance = mirroring.find((mirror) => mirror.name == packetMirrorName)
    let regexPattern = /metlo-packet-mirroring-([a-z0-9\-]*)/gm;
    let metloRegexResp = regexPattern.exec(mirrorInstance.name)
    if (metloRegexResp.length != 2) {
        throw new Error("Packet Mirroring policy didn't match expected pattern. Please try manual deletion.")
    }
    let metloUUID = metloRegexResp[1]
    assert.ok(validate(metloUUID), "Metlo Packet Mirroring selected has invalid UUID")

    spinner.start("Deleting packet mirroring")
    // Delete GCP Packet Mirroring
    try {
        let resp_pack = await conn.stop_packet_mirroring({
            packetMirroringURL: packetMirrorName,
        })
        await wait_for_regional_operation(resp_pack[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(
            `Couldn't delete GCP Packet Mirroring  ${mirrorInstance.selfLink}`,
        )
    }
    spinner.succeed("Deleted packet mirroring")

    spinner.start("Deleting Forwarding Rule")
    // Delete GCP Load Balancer
    const collectorName = (mirrorInstance.collectorIlb.url.split("/").at(-1))
    assert.ok(
        collectorName == `metlo-forwarding-rule-${metloUUID}`,
        `Forwarding rule didn't match expected name.
        Found ${collectorName},expected metlo-forwarding-rule-${metloUUID}`
    )
    try {
        let resp_ilb = await conn.delete_forwarding_rule({
            forwardingRuleURL: collectorName,
        })
        await wait_for_regional_operation(resp_ilb[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(
            `Couldn't delete GCP Forwarding Rule ${mirrorInstance.collectorIlb.url}`,
        )
    }
    spinner.succeed("Deleted Forwarding Rule")

    spinner.start("Deleting Load Balancer")
    const [backends, ,] = await conn.list_backend_service()
    const backend = backends.find((_backend) => _backend.name.includes(`metlo-backend-${metloUUID}`))
    const backendName = backend.selfLink.split("/").at(-1)
    assert.ok(
        backendName == `metlo-backend-${metloUUID}`,
        `Load Balancer service didn't match expected name.
        Found ${backendName},expected metlo-backend-${metloUUID}`
    )
    // Delete GCP Backend Service
    try {
        let resp_back = await conn.delete_backend_service({
            backendServiceURL: backendName,
        })
        await wait_for_regional_operation(resp_back[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(
            `Couldn't delete GCP Backend Service ${backend.name}`,
        )
    }
    spinner.succeed("Deleted Load Balancer")

    spinner.start("Deleting Health Check")
    const [healthChecks, ,] = await conn.list_health_checks()
    const check = healthChecks.find((_check) => _check.name.includes(metloUUID))
    const healthCheckName = check.selfLink.split("/").at(-1)
    assert.ok(
        healthCheckName == `metlo-health-check-${metloUUID}`,
        `Health Check service didn't match expected name.
        Found ${healthCheckName},expected metlo-health-check-${metloUUID}`
    )
    // Delete GCP Health Check
    try {
        let resp_health = await conn.delete_health_check({
            healthCheckURL: healthCheckName,
        })
        await wait_for_global_operation(resp_health[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(`Couldn't delete GCP Health Check ${check.name}`)
    }
    spinner.succeed("Deleted Health Check")

    spinner.start("Deleting Instance Group")
    const [instanceGroups, ,] = await conn.list_instance_manager()
    const group = instanceGroups.find((_group) => _group.name.includes(metloUUID))
    const groupName = group.selfLink.split("/").at(-1)
    assert.ok(
        groupName == `metlo-mig-${metloUUID}`,
        `Instance Group didn't match expected name.
        Found ${groupName},expected metlo-mig-${metloUUID}`
    )
    // Delete GCP Instance Group Manager
    try {
        let resp_mig = await conn.delete_instance_manager({
            managerURL: groupName,
        })
        await wait_for_zonal_operation(resp_mig[0].name, conn, 7)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(
            `Couldn't delete Managed Instance Group ${group.name}`,
        )
    }
    spinner.succeed("Deleted Instance Group")

    spinner.start("Deleting Instance Template")
    const [templates, ,] = await conn.list_image_template()
    const template = templates.find((_template) => _template.name.includes(metloUUID))
    const templateName = template.selfLink.split("/").at(-1)
    assert.ok(
        templateName == `metlo-image-template-${metloUUID}`,
        `Instance Template didn't match expected name.
        Found ${templateName},expected metlo-image-template-${metloUUID}`
    )
    // Delete GCP Instance Template
    try {
        let resp_mig = await conn.delete_image_template({
            templateURL: templateName,
        })
        await wait_for_global_operation(resp_mig[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(`Couldn't delete Image Template ${template.name}`)
    }
    spinner.succeed("Deleted Instance Template")

    // Delete GCP Cloud Router ====> Cloud router might be shared. Let's skip this
    //   try {
    //     let resp_mig = await conn.delete_router({
    //       routerURL: gcp.router_url,
    //     })
    //     await wait_for_global_operation(resp_mig[0].name, conn)
    //   } catch (err) {
    //     throw new Error(`Couldn't delete Cloud router ${gcp.router_url}`)
    //   }

    // Delete GCP Subnet => Might be used in the above router. So avoid deleting
    //   try {
    //     let resp_subnet = await conn.delete_subnet({
    //       subnetURL: gcp.destination_subnetwork_url.split("/").at(-1),
    //     })
    //     await wait_for_regional_operation(resp_subnet[0].name, conn)
    //   } catch (err) {
    //     throw new Error(`Couldn't delete subnet ${gcp.destination_subnetwork_url}`)
    //   }
    spinner.start("Deleting inbound Firewall Rule")
    const [firewalls, ,] = await conn.list_firewall_rules()
    const firewallInbound = firewalls.find((_firewall) => _firewall.name.includes(`metlo-firewall-in-${metloUUID}`))
    const firewallInboundName = firewallInbound.selfLink.split("/").at(-1)
    assert.ok(
        firewallInboundName == `metlo-firewall-in-${metloUUID}`,
        `Inbound Firewall didn't match expected name.
        Found ${firewallInboundName},expected metlo-firewall-in-${metloUUID}`
    )
    //   Delete GCP Firewall
    try {
        let resp_firewall = await conn.delete_firewall_rule({
            firewallURL: firewallInboundName,
        })
        await wait_for_global_operation(resp_firewall[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(`Couldn't delete Firewall rule ${firewallInbound.name}`)
    }
    spinner.succeed("Deleted inbound Firewall Rule")

    spinner.start("Deleting outbound Firewall Rule")
    const firewallOutbound = firewalls.find((_firewall) => _firewall.name.includes(`metlo-firewall-out-${metloUUID}`))
    const firewallOutboundName = firewallOutbound.selfLink.split("/").at(-1)
    assert.ok(
        firewallOutboundName == `metlo-firewall-out-${metloUUID}`,
        `Outbound Firewall didn't match expected name.
        Found ${firewallOutboundName},expected metlo-firewall-out-${metloUUID}`
    )
    //   Delete GCP Firewall
    try {
        let resp_firewall = await conn.delete_firewall_rule({
            firewallURL: firewallOutboundName,
        })
        await wait_for_global_operation(resp_firewall[0].name, conn)
    } catch (err) {
        spinner.stop()
        console.warn(err)
        throw new Error(`Couldn't delete Firewall rule ${firewallOutbound.name}`)
    }
    spinner.succeed("Deleted inbound Firewall Rule")

    return `Deleted connection ${metloUUID}`
}

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

export const gcpTrafficMirrorCleanUp = async () => {
    const id = uuidv4()
    const data = {}
    try {
        const { project, zone, network, key } = await verifyAccountDetails()
        const networkUrl = `https://www.googleapis.com/compute/v1/projects/${project}/global/networks/${network}`
        const conn = new GCP_CONN(key, zone, project);
        data["zone"] = zone
        data["project"] = project

        await cleanupGCP(conn, zone, project, networkUrl)
    } catch (e) {
        spinner.fail()
        console.log(chalk.bgRedBright("Metlo packet mirroring item removal failed. This might help in debugging it."))
        console.log(e)
        console.log(data)
    }
}
