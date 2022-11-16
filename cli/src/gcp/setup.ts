import AsyncRetry from "async-retry"
import { v4 as uuidv4, validate } from "uuid"
import fs from "fs"
import { prompt } from "enquirer"
import { GCP_REGIONS_SUPPORTED, wait_for_global_operation, wait_for_regional_operation, wait_for_zonal_operation } from "./gcpUtils"
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

const sourceSelection = async (conn: GCP_CONN) => {

    var source_private_ip, source_subnetwork_url, source_instance_url, sourceTag = null
    const sourceTypeResp = await prompt([
        {
            type: "select",
            name: "_sourceType",
            message: "Select your mirror source type",
            initial: 0,
            choices: ["INSTANCE", "SUBNET", "TAG"],
        }
    ])
    let sourceType = sourceTypeResp["_sourceType"]

    if (sourceType === "INSTANCE") {
        const instanceNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source instance name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let resp = await conn.get_instance(instanceNameResp['_name'].trim())
        source_private_ip = resp[0].networkInterfaces[0].networkIP
        source_subnetwork_url = resp[0].networkInterfaces[0].subnetwork
        source_instance_url = resp[0].selfLink
    } else if (sourceType === "SUBNET") {
        const subnetNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source subnet name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let resp = await conn.get_subnet_information({
            subnetName: subnetNameResp['_name'].trim(),
        })

        source_private_ip = resp[0].ipCidrRange
        source_subnetwork_url = resp[0].selfLink
        source_instance_url = resp[0].selfLink
    } else if (sourceType === "TAG") {
        const tagNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source tag name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let resp = await conn.list_instances()
        let tagName = tagNameResp["_name"].trim()
        if (!resp[0].find(v => v.tags.items.includes(tagName))) {
            throw new Error(
                `No instances with tag ${tagName} found in specific zone`,
            )
        }
        sourceTag: tagNameResp["_name"]
        source_private_ip = "0.0.0.0/0" // Allow any since filtering is done on tags by gcp
        source_subnetwork_url = ""
        source_instance_url = ""
    }
    spinner.succeed("Verified mirror source details")
    spinner.stop()
    spinner.clear()
    return {
        sourceType,
        sourcePrivateIP: source_private_ip,
        sourceSubnetworkURL: source_subnetwork_url,
        sourceInstanceURL: source_instance_url,
        sourceTag,
    }

}

const getDestinationSubnet = async (
    conn,
    network_url,
    id,
) => {
    let addressName = `metlo-address-temporary-${id}`

    spinner.text = "Creating Destination subnet"
    spinner.start()

    let address_resp = await conn.create_new_internal_address({
        addressName: addressName,
        network: network_url,
        prefixLength: 24,
    })

    await wait_for_global_operation(address_resp[0].latestResponse.name, conn)

    let connectionReadyResp = await AsyncRetry(
        async (f, at) => {
            let resp = await conn.get_address_information({
                addressName: addressName,
            })
            if (resp[0].status === "RESERVED") {
                return resp
            } else {
                throw Error("Couldn't reserve address")
            }
        },
        { retries: 5 },
    )
    const ip_range = `${connectionReadyResp[0].address}/${connectionReadyResp[0].prefixLength}`

    let delete_resp = await conn.delete_new_address({
        addressName: addressName,
    })
    await wait_for_global_operation(delete_resp[0].latestResponse.name, conn)

    let destination_subnetwork = await conn.create_new_subnet({
        network: network_url,
        ipCidr: ip_range,
        name: `metlo-subnet-${id}`,
    })
    await wait_for_regional_operation(
        destination_subnetwork[0].latestResponse.name,
        conn,
    )

    spinner.succeed("Created destination subnet")
    spinner.stop()
    spinner.clear()
    return { ipRange: ip_range, destinationSubnetworkUrl: destination_subnetwork[0].latestResponse.targetLink }
}

const createFirewallRule = async (
    conn,
    network_url,
    ip_range,
    id
) => {
    const firewallName = `metlo-firewall-${id}`
    spinner.text = "Creating Firewall rule"
    spinner.start()
    let resp = await conn.create_firewall_rule({
        firewallName,
        networkName: network_url,
        ipRange: ip_range,
    })
    spinner.succeed("Created Firewall rule")
    spinner.stop()
    spinner.clear()
    return { firewallRuleUrl: resp[0].latestResponse.targetLink }
}

const createCloudRouter = async (
    conn,
    network_url,
    destination_subnetwork_url,
    id,
) => {
    spinner.text = "Creating or adding existing router"
    spinner.start()
    let resp = await conn.list_routers()
    let useful_routers = resp[0].filter(v => {
        const usesfulNats = v.nats.filter(nat =>
            [
                "ALL_SUBNETWORKS_ALL_IP_RANGES",
                "ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES",
            ].includes(nat.sourceSubnetworkIpRangesToNat),
        )
        return v.network === network_url && usesfulNats.length > 0
    })
    var router_url
    if (useful_routers.length > 0) {
        const useful_nats = useful_routers[0].nats.find(nat =>
            [
                "ALL_SUBNETWORKS_ALL_IP_RANGES",
                "ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES",
            ].includes(nat.sourceSubnetworkIpRangesToNat),
        )
        if (useful_nats) {
            router_url = useful_routers[0].selfLink
        }
    }
    if (!router_url) {
        let new_router = await conn.create_router({
            routerName: `metlo-router-${id}`,
            networkURL: network_url,
            subnetURL: destination_subnetwork_url,
        })
        // @ts-ignore
        router_url = new_router[0].latestResponse.targetLink
    }

    spinner.succeed("Obtained router details")
    spinner.stop()
    spinner.clear()
    return {
        routerURL: router_url
    }

}

const create_mig = async (
    conn: GCP_CONN,
    network_url: string,
    destination_subnetwork_url: string,
    source_image: string,
    id: string,
) => {

    const [types] = await conn.list_machine_types({ filters: [] })
    const machineInfoResp = await prompt([
        {
            type: "autocomplete",
            name: "_machineType",
            message: "Mirror Instance Type",
            initial: types.sort().findIndex((v) => v.name.includes("e2-standard")) || 0,
            choices: types.map((v) => ({
                name: v.name
            }))
        }, {
            type: "input",
            name: "_url",
            message: "Metlo URL",
            hint: "http://www.example.com or http://12.34.56",
            validate: (url: string) => {
                try {
                    new URL(url)
                    return true
                } catch (err) {
                    return false
                }
            }
        }, {
            type: "input",
            name: "_apiKey",
            message: "Metlo API Key",
            hint: "metlo.abcd.....xyz",
            validate: (apiKey: string) => {
                try {
                    const [metlo, strPart] = apiKey.split(".")
                    if (metlo == 'metlo') {
                        if (strPart.length == 40) {
                            return true
                        } else {
                            return chalk.red("Invalid key length. Key length should be 46 characters long")
                        }
                    } else {
                        return chalk.red("Api key must begin with metlo")
                    }
                } catch (err) {
                    return false
                }
            }
        }
    ])
    spinner.text = "Creating Managed Instance Group for metlo"
    spinner.start()

    spinner.text = "Creating Image Template"
    const imageTemplateName = `metlo-image-template-${id}`
    let image_resp = await conn.create_image_template({
        machineType: machineInfoResp["_machineType"],
        sourceImage: source_image,
        network: network_url,
        subnet: destination_subnetwork_url,
        imageTemplateName: imageTemplateName,
        startupScript: `#!/bin/bash
        echo "METLO_ADDR=${machineInfoResp['_url']}" >> /opt/metlo/credentials
        echo "METLO_KEY=${machineInfoResp['_apiKey']}" >>  /opt/metlo/credentials        
        sudo systemctl enable metlo-ingestor.service
        sudo systemctl start metlo-ingestor.service`
    })
    let img_resp = await wait_for_global_operation(
        image_resp[0].latestResponse.name,
        conn,
    )

    spinner.text = "Creating Instance Group manager"
    const instanceGroupName = `metlo-mig-${id}`
    let instance_manager = await conn.create_instance_manager({
        templateURL: img_resp[0].targetLink,
        instanceName: instanceGroupName,
    })
    let resp = await wait_for_zonal_operation(
        instance_manager[0].latestResponse.name,
        conn,
    )

    const instance_name = `metlo-scaler-${id}`

    spinner.text = "Verifying Instance Group existence"
    let instance = await conn.list_instance_for_group({
        managedGroupName: instanceGroupName,
    })
    spinner.succeed("Created MIG for metlo")
    spinner.stop()
    spinner.clear()
    return {
        // @ts-ignore
        imageTemplateUrl: image_resp[0].latestResponse.targetLink,
        // @ts-ignore
        instanceUrl: instance[0][0].instance,
        instanceGroupName,
    }
}

const createHealthCheck = async (
    conn: GCP_CONN,
    id: string,
) => {
    spinner.text = "Creating Health check for backend service"
    spinner.start()
    const health_check_name = `metlo-health-check-${id}`
    let resp = await conn.create_health_check({
        healthCheckName: health_check_name,
    })
    await wait_for_global_operation(resp[0].latestResponse.name, conn)
    spinner.succeed("Created health check")
    spinner.stop()
    spinner.clear()
    return {
        //@ts-ignore
        healthCheckUrl: resp[0].latestResponse.targetLink,
    }

}

const createBackendService = async (
    conn: GCP_CONN,
    network_url,
    managed_group_url,
    health_check_url,
    id) => {
    spinner.start("Creating Backend service for packet mirroring")
    const backend_name = `metlo-backend-${id}`
    let resp = await conn.create_backend_service({
        networkURL: network_url,
        managedGroupURL: managed_group_url,
        healthCheckURL: health_check_url,
        name: backend_name,
    })
    await wait_for_regional_operation(resp[0].latestResponse.name, conn)
    spinner.succeed()
    spinner.stop()
    spinner.clear()
    return {
        //@ts-ignore
        backendServiceUrl: resp[0].latestResponse.targetLink,
    }

}

const createLoadBalancer = async (
    conn: GCP_CONN,
    network_url,
    destination_subnetwork_url,
    backend_service_url,
    id) => {
    spinner.start("Creating load balancer for metlo/backend service")
    const rule_name = `metlo-forwarding-rule-${id}`
    let resp = await conn.create_forwarding_rule({
        networkURL: network_url,
        name: rule_name,
        subnetURL: destination_subnetwork_url,
        backendServiceURL: backend_service_url,
    })
    await wait_for_regional_operation(resp[0].latestResponse.name, conn)
    spinner.succeed("Created load balancer")
    spinner.stop()
    spinner.clear()
    return {
        //@ts-ignore
        forwardingRuleUrl: resp[0].latestResponse.targetLink,
    }
}

const packetMirroring = async (
    conn: GCP_CONN,
    network_url,
    forwarding_rule_url,
    source_instance_url,
    mirror_source_value,
    source_type,
    id
) => {
    spinner.start("Starting packet mirroring")
    const packet_mirror_name = `metlo-packet-mirroring-${id}`
    var packet_mirror_url;
    if (source_type === "INSTANCE") {
        let resp = await conn.start_packet_mirroring({
            networkURL: network_url,
            name: packet_mirror_name,
            mirroredInstanceURLs: [source_instance_url],
            loadBalancerURL: forwarding_rule_url,
        })
        packet_mirror_url = (
            await wait_for_regional_operation(resp[0].latestResponse.name, conn)
        )[0].targetLink
    } else if (source_type === "SUBNET") {
        let resp = await conn.start_packet_mirroring({
            networkURL: network_url,
            name: packet_mirror_name,
            mirroredSubnetURLS: [source_instance_url],
            loadBalancerURL: forwarding_rule_url,
        })
        packet_mirror_url = (
            await wait_for_regional_operation(resp[0].latestResponse.name, conn)
        )[0].targetLink
    } else if (source_type === "TAG") {
        let resp = await conn.start_packet_mirroring({
            networkURL: network_url,
            name: packet_mirror_name,
            mirroredTagURLs: mirror_source_value,
            loadBalancerURL: forwarding_rule_url,
        })
        packet_mirror_url = (
            await wait_for_regional_operation(resp[0].latestResponse.name, conn)
        )[0].targetLink
    }
    spinner.succeed("Started packet mirroring")
    spinner.stop()
    spinner.clear()
    return { packetMirrorUrl: packet_mirror_url }

}

const updatePacketMirroring = async (
    conn: GCP_CONN,
    mirroring: google.cloud.compute.v1.IPacketMirroring[]
) => {
    const sourceTypeResp = await prompt([
        {
            type: "autocomplete",
            name: "_packetMirrorName",
            message: "Select Packet Mirroring instance",
            initial: 0,
            choices: mirroring.map((inst) => inst.name)
        }, {
            type: "select",
            name: "_sourceType",
            message: "Select your mirror source type",
            initial: 0,
            choices: ["INSTANCE", "SUBNET", "TAG"],
        },
    ])
    let sourceType = sourceTypeResp["_sourceType"]
    let packetMirrorName = sourceTypeResp["_packetMirrorName"]

    if (sourceType === "INSTANCE") {
        const instanceNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source instance name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let [resp] = await conn.get_instance(instanceNameResp['_name'].trim())
        await conn.update_packet_mirroring({ packetMirrorName, updateInstance: { url: resp.selfLink } })
    } else if (sourceType === "SUBNET") {
        const subnetNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source subnet name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let [resp] = await conn.get_subnet_information({
            subnetName: subnetNameResp['_name'].trim(),
        })
        await conn.update_packet_mirroring({ packetMirrorName, updateSubnet: { url: resp.selfLink } })
    } else if (sourceType === "TAG") {
        const tagNameResp = await prompt([
            {
                type: "input",
                name: "_name",
                message: "Enter the mirror source tag name",
            }
        ])
        spinner.start("Verifying mirror source details")
        let [resp] = await conn.list_instances()
        let tagName = tagNameResp["_name"].trim()
        if (!resp.find(v => v.tags.items.includes(tagName))) {
            throw new Error(
                `No instances with tag ${tagName} found in specific zone`,
            )
        }
        await conn.update_packet_mirroring({ packetMirrorName, updateTag: tagName })
    }
    spinner.succeed("Updated packet mirroring")
    spinner.stop()
    spinner.clear()
    return {}
}

const imageURL = "https://www.googleapis.com/compute/v1/projects/metlo-security/global/images/metlo-ingestor-v3"

export const gcpTrafficMirrorSetup = async () => {
    const id = uuidv4()
    const data = {}
    try {
        const { project, zone, network, key } = await verifyAccountDetails()
        console.log("Validated account details succesfully")
        const networkUrl = `https://www.googleapis.com/compute/v1/projects/${project}/global/networks/${network}`
        const conn = new GCP_CONN(key, zone, project);
        data["key"] = key
        data["zone"] = zone
        data["project"] = project

        const [packetMirrors] = await conn.list_packet_mirroring()

        if (packetMirrors.length > 0) {
            console.log(chalk.blue("Updating the existing Packet Mirroring instance instead of creating new."))
            await updatePacketMirroring(conn, packetMirrors)
        } else {
            const { sourceType, sourceInstanceURL, sourcePrivateIP, sourceSubnetworkURL, sourceTag } = await sourceSelection(conn)
            data["sourceType"] = sourceType
            data["sourceInstanceURL"] = sourceInstanceURL
            data["sourcePrivateIP"] = sourcePrivateIP
            data["sourceSubnetworkURL"] = sourceSubnetworkURL
            data["sourceTag"] = sourceTag
            const { ipRange, destinationSubnetworkUrl } = await getDestinationSubnet(conn, networkUrl, id)
            data["ipRange"] = ipRange
            data["destinationSubnetworkUrl"] = destinationSubnetworkUrl
            const { firewallRuleUrl } = await createFirewallRule(conn, networkUrl, ipRange, id)
            data["firewallRuleUrl"] = firewallRuleUrl
            const { routerURL } = await createCloudRouter(conn, networkUrl, destinationSubnetworkUrl, id)
            data["routerURL"] = routerURL
            const { imageTemplateUrl, instanceGroupName, instanceUrl } = await create_mig(conn, networkUrl, destinationSubnetworkUrl, imageURL, id)
            data['mageTemplateUrl'] = imageTemplateUrl
            data['instanceGroupName'] = instanceGroupName
            data['instanceUrl'] = instanceUrl
            const managedGroupUrl = `https://www.googleapis.com/compute/v1/projects/${project}/zones/${zone}/instanceGroups/${instanceGroupName}`
            data['managedGroupUrl'] = managedGroupUrl
            const { healthCheckUrl } = await createHealthCheck(conn, id)
            data['healthCheckUrl'] = healthCheckUrl
            const { backendServiceUrl } = await createBackendService(conn, networkUrl, managedGroupUrl, healthCheckUrl, id)
            data['backendServiceUrl'] = backendServiceUrl
            const { forwardingRuleUrl } = await createLoadBalancer(conn, networkUrl, destinationSubnetworkUrl, backendServiceUrl, id)
            data['forwardingRuleUrl'] = forwardingRuleUrl
            const { packetMirrorUrl } = await packetMirroring(conn, networkUrl, forwardingRuleUrl, sourceInstanceURL, sourceTag, sourceType, id)
            data["packetMirrorUrl"] = packetMirrorUrl
        }
    } catch (e) {
        spinner.fail()
        console.log(e)
        console.log(data)
    }
}
