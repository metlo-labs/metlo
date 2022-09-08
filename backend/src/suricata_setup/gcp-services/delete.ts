import { STEP_RESPONSE } from "@common/types"
import { ConnectionType } from "@common/enums"
import { randomUUID } from "crypto"
import { GCP_CONN } from "./gcp_apis"
import {
  wait_for_zonal_operation as await_zonal,
  wait_for_global_operation as await_global,
  wait_for_regional_operation as await_regional,
} from "./gcp_setup"

export async function delete_gcp_data(
  gcp: STEP_RESPONSE<ConnectionType.GCP>["data"],
) {
  let client = new GCP_CONN(gcp.key_file, gcp.zone, gcp.project)

  // Delete GCP Packet Mirroring
  try {
    let resp_pack = await client.stop_packet_mirroring({
      packetMirroringURL: gcp.packet_mirror_url.split("/").at(-1),
    })
    await await_regional(resp_pack[0].name, client)
  } catch (err) {
    throw new Error(
      `Couldn't delete GCP Packet Mirroring  ${gcp.packet_mirror_url}`,
    )
  }
  // Delete GCP Load Balancer
  try {
    let resp_ilb = await client.delete_forwarding_rule({
      forwardingRuleURL: gcp.forwarding_rule_url.split("/").at(-1),
    })
    await await_regional(resp_ilb[0].name, client)
  } catch (err) {
    throw new Error(
      `Couldn't delete GCP Forwarding Rule ${gcp.forwarding_rule_url}`,
    )
  }

  // Delete GCP Backend Service
  try {
    let resp_back = await client.delete_backend_service({
      backendServiceURL: gcp.backend_service_url.split("/").at(-1),
    })
    await await_regional(resp_back[0].name, client)
  } catch (err) {
    throw new Error(
      `Couldn't delete GCP Backend Service ${gcp.backend_service_url}`,
    )
  }

  // Delete GCP Health Check
  try {
    let resp_health = await client.delete_health_check({
      healthCheckURL: gcp.health_check_url.split("/").at(-1),
    })
    await await_global(resp_health[0].name, client)
  } catch (err) {
    throw new Error(`Couldn't delete GCP Health Check ${gcp.health_check_url}`)
  }

  // Delete GCP Instance Group Manager
  try {
    let resp_mig = await client.delete_instance_manager({
      managerURL: gcp.managed_group_url.split("/").at(-1),
    })
    await await_zonal(resp_mig[0].name, client)
  } catch (err) {
    throw new Error(
      `Couldn't delete Managed Instance Group ${gcp.managed_group_url}`,
    )
  }

  // Delete GCP Instance Template
  try {
    let resp_mig = await client.delete_image_template({
      templateURL: gcp.image_template_url.split("/").at(-1),
    })
    await await_global(resp_mig[0].name, client)
  } catch (err) {
    throw new Error(`Couldn't delete Image Template ${gcp.image_template_url}`)
  }

  // Delete GCP Cloud Router ====> Cloud router might be shared. Let's skip this
  //   try {
  //     let resp_mig = await client.delete_router({
  //       routerURL: gcp.router_url,
  //     })
  //     await await_global(resp_mig[0].name, client)
  //   } catch (err) {
  //     throw new Error(`Couldn't delete Cloud router ${gcp.router_url}`)
  //   }

  // Delete GCP Subnet => Might be used in the above router. So avoid deleting
  //   try {
  //     let resp_subnet = await client.delete_subnet({
  //       subnetURL: gcp.destination_subnetwork_url.split("/").at(-1),
  //     })
  //     await await_regional(resp_subnet[0].name, client)
  //   } catch (err) {
  //     throw new Error(`Couldn't delete subnet ${gcp.destination_subnetwork_url}`)
  //   }

  //   Delete GCP Firewall
  try {
    let resp_firewall = await client.delete_firewall_rule({
      firewallURL: gcp.firewall_rule_url.split("/").at(-1),
    })
    await await_global(resp_firewall[0].name, client)
  } catch (err) {
    throw new Error(`Couldn't delete Firewall rule ${gcp.firewall_rule_url}`)
  }

  return `Deleted connection ${gcp.id}`
}
