import { MachineSpecifications, STEP_RESPONSE } from "@common/types"
import { ConnectionType, GCP_STEPS } from "@common/enums"
import { GCP_CONN } from "./gcp_apis"
import AsyncRetry from "async-retry"
import { promisify } from "util"
import { exec } from "child_process"
import {  writeFileSync, unlinkSync } from "fs"
import {
  put_data_file,
  remove_file,
  format,
} from "suricata_setup/ssh-services/ssh-setup"
import path from "path"

const promiseExec = promisify(exec)

type RESPONSE = STEP_RESPONSE<ConnectionType.GCP>

export async function gcp_key_setup({
  key_file,
  zone,
  project,
  network_name,
  id,
  ...rest
}: RESPONSE["data"]): Promise<STEP_RESPONSE<ConnectionType.GCP>> {
  const fileName = `authFile-${id}`
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    await conn.test_connection()
    let network_resp = await conn.get_networks({ name: network_name })

    const file = writeFileSync(fileName, key_file, { flag: "w" })
    await promiseExec(
      `gcloud auth activate-service-account --key-file=${fileName}`,
    )

    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 1,
      next_step: 2,
      last_completed: 1,
      message: "Verified GCP Credentials",
      error: null,
      data: {
        id,
        key_file,
        zone,
        project,
        network_url: network_resp[0].selfLink,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 1,
      next_step: 2,
      last_completed: 0,
      message:
        "Couldn't verify GCP Credentials. Please verify that access id and secret access key are correct.",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        id,
        ...rest,
      },
    }
  } finally {
    unlinkSync(fileName)
  }
}

export async function gcp_source_identification({
  key_file,
  zone,
  project,
  source_instance_name,
  ...rest
}: RESPONSE["data"]): Promise<STEP_RESPONSE<ConnectionType.GCP>> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    let resp = await conn.get_instance(source_instance_name)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 2,
      next_step: 3,
      last_completed: 2,
      message: "Verified GCP source instance",
      error: null,
      data: {
        key_file,
        zone,
        project,
        source_instance_name,
        source_private_ip: resp[0].networkInterfaces[0].networkIP,
        source_subnetwork_url: resp[0].networkInterfaces[0].subnetwork,
        source_instance_url: resp[0].selfLink,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 1,
      next_step: 2,
      last_completed: 0,
      message:
        "Couldn't verify mirroring source presence in region/zone. Please verify name and zone .",
      error: {
        err: JSON.stringify(err),
      },
      data: { key_file, zone, project, ...rest },
    }
  }
}

export async function get_destination_subnet({
  key_file,
  project,
  zone,
  network_url,
  id,
  ...rest
}: RESPONSE["data"]): Promise<STEP_RESPONSE<ConnectionType.GCP>> {
  try {
    let addressName = `metlo-address-temporary-${id}`
    let conn = new GCP_CONN(key_file, zone, project)

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
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 3,
      next_step: 4,
      last_completed: 3,
      message: "Creating GCP Address",
      error: null,
      data: {
        key_file,
        zone,
        project,
        ip_range: ip_range,
        network_url,
        destination_subnetwork_url:
          //@ts-ignore
          destination_subnetwork[0].latestResponse.targetLink,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 3,
      next_step: 3,
      last_completed: 2,
      message: "Couldn't create subnet",
      error: {
        err: JSON.stringify(err),
      },
      data: { key_file, project, zone, network_url, id, ...rest },
    }
  }
}

export async function create_firewall_rule({
  key_file,
  project,
  zone,
  network_url,
  ip_range,
  id,
  ...rest
}: RESPONSE["data"]): Promise<STEP_RESPONSE<ConnectionType.GCP>> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const firewallName = `metlo-firewall-${id}`
    let resp = await conn.create_firewall_rule({
      firewallName,
      networkName: network_url,
      ipRange: ip_range,
    })

    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 4,
      next_step: 5,
      last_completed: 4,
      message: "Creating GCP Address",
      error: null,
      data: {
        key_file,
        zone,
        project,
        network_url,
        ip_range,
        //@ts-ignore
        firewall_url: resp[0].latestResponse.targetLink,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 4,
      next_step: 4,
      last_completed: 3,
      message: "Couldn't create firewall rule.",
      error: {
        err: JSON.stringify(err),
      },
      data: { key_file, zone, project, network_url, ip_range, id, ...rest },
    }
  }
}

export async function create_cloud_router({
  key_file,
  project,
  zone,
  network_url,
  destination_subnetwork_url,
  ip_range,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
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
    ;("https://www.googleapis.com/compute/v1/projects/metlo-crypto/regions/us-west1/subnetworks/metlo-subnet-3e63bb14-bdb4-4c6d-bc41-31512ca50ad2")
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 5,
      next_step: 6,
      last_completed: 5,
      message: "Creating GCP Address",
      error: null,
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        router_url,
        ip_range,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 5,
      next_step: 5,
      last_completed: 4,
      message: "Couldn't create firewall rule.",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        ip_range,
        id,
        ...rest,
      },
    }
  }
}

export async function create_mig({
  key_file,
  project,
  zone,
  network_url,
  destination_subnetwork_url,
  machine_type,
  source_image,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const imageTemplateName = `metlo-image-${id}`
    let image_resp = await conn.create_image_template({
      machineType: machine_type,
      sourceImage: source_image,
      network: network_url,
      subnet: destination_subnetwork_url,
      imageTemplateName: imageTemplateName,
    })
    let img_resp = await wait_for_global_operation(
      image_resp[0].latestResponse.name,
      conn,
    )

    // const imgUrl =
    //   "https://www.googleapis.com/compute/v1/projects/metlo-crypto/global/instanceTemplates/metlo-image-98c897b9-9660-4176-a986-9c60fde2bc11"

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

    let instance = await conn.list_instance_for_group({
      managedGroupName: instanceGroupName,
    })

    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 5,
      next_step: 6,
      last_completed: 5,
      message: "Creating GCP Address",
      error: null,
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        machine_type,
        source_image,
        id,
        // @ts-ignore
        image_template_url: image_resp[0].latestResponse.targetLink,
        // @ts-ignore
        instance_url: instance[0][0].instance,
        managed_group_url: `https://www.googleapis.com/compute/v1/projects/${project}/zones/${zone}/instanceGroups/${instanceGroupName}`,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 5,
      next_step: 5,
      last_completed: 4,
      message: "Couldn't create firewall rule.",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        machine_type,
        source_image,
        id,
        ...rest,
      },
    }
  }
}

export async function create_health_check({
  key_file,
  project,
  zone,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const health_check_name = `metlo-health-check-${id}`
    let resp = await conn.create_health_check({
      healthCheckName: health_check_name,
    })
    await wait_for_global_operation(resp[0].latestResponse.name, conn)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 8,
      next_step: 9,
      last_completed: 8,
      message: "Creating GCP Keypair",
      error: null,
      data: {
        key_file,
        project,
        zone,
        id,
        //@ts-ignore
        health_check_url: resp[0].latestResponse.targetLink,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 8,
      next_step: 8,
      last_completed: 7,
      message: "Couldn't add ssh-keys",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        id,
        ...rest,
      },
    }
  }
}

export async function create_backend_service({
  key_file,
  project,
  zone,
  network_url,
  instance_url,
  managed_group_url,
  health_check_url,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const backend_name = `metlo-backend-${id}`
    let resp = await conn.create_backend_service({
      networkURL: network_url,
      managedGroupURL: managed_group_url,
      healthCheckURL: health_check_url,
      name: backend_name,
    })
    await wait_for_regional_operation(resp[0].latestResponse.name, conn)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 9,
      next_step: 10,
      last_completed: 9,
      message: "Creating GCP Keypair",
      error: null,
      data: {
        key_file,
        project,
        zone,
        network_url,
        instance_url,
        managed_group_url,
        health_check_url,
        //@ts-ignore
        backend_service_url: resp[0].latestResponse.targetLink,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 9,
      next_step: 9,
      last_completed: 8,
      message: "Couldn't add ssh-keys",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        network_url,
        instance_url,
        managed_group_url,
        health_check_url,
        id,
        ...rest,
      },
    }
  }
}

export async function create_load_balancer({
  key_file,
  project,
  zone,
  network_url,
  destination_subnetwork_url,
  backend_service_url,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const rule_name = `metlo-forwarding-rule-${id}`
    let resp = await conn.create_forwarding_rule({
      networkURL: network_url,
      name: rule_name,
      subnetURL: destination_subnetwork_url,
      backendServiceURL: backend_service_url,
    })
    await wait_for_regional_operation(resp[0].latestResponse.name, conn)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 11,
      last_completed: 10,
      message: "Creating GCP Keypair",
      error: null,
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        //@ts-ignore
        forwarding_rule_url: resp[0].latestResponse.targetLink,
        backend_service_url,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 10,
      last_completed: 9,
      message: "Couldn't add ssh-keys",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        network_url,
        destination_subnetwork_url,
        backend_service_url,
        id,
        ...rest,
      },
    }
  }
}

export async function packet_mirroring({
  key_file,
  project,
  zone,
  network_url,
  forwarding_rule_url,
  source_instance_url,
  id,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    const packet_mirror_name = `metlo-packet-mirroring-${id}`
    let resp = await conn.start_packet_mirroring({
      networkURL: network_url,
      name: packet_mirror_name,
      mirroredInstanceURL: source_instance_url,
      loadBalancerURL: forwarding_rule_url,
    })
    await wait_for_regional_operation(resp[0].latestResponse.name, conn)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 12,
      last_completed: 11,
      message: "Creating GCP Keypair",
      error: null,
      data: {
        key_file,
        project,
        zone,
        network_url,
        forwarding_rule_url,
        source_instance_url,
        //@ts-ignore
        packet_mirror_url: resp[0].latestResponse.targetLink,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 11,
      last_completed: 10,
      message: "Couldn't add ssh-keys",
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        project,
        zone,
        network_url,
        forwarding_rule_url,
        source_instance_url,
        id,
        ...rest,
      },
    }
  }
}

export async function add_temporary_public_url({
  key_file,
  project,
  zone,
  network_url,
  network_name,
  retry_uuid,
  instance_url,
  id,
  ...rest
}: RESPONSE["data"] & { retry_uuid: string }): Promise<RESPONSE> {
  try {
    let conn = new GCP_CONN(key_file, zone, project)
    let addressName = `metlo-address-temp-${retry_uuid}`
    let addr_info = await conn.create_new_external_address({
      addressName: addressName,
      network: network_name,
    })
    await wait_for_regional_operation(addr_info[0].latestResponse.name, conn)
    let connectionReadyResp = await AsyncRetry(
      async (f, at) => {
        let resp = await conn.get_external_address({
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
    const temp_ip = connectionReadyResp[0].address
    let instance_name = instance_url.split("/").at(-1)
    let resp = await conn.attach_external_ip({
      instanceURL: instance_name,
      address: temp_ip,
    })
    await wait_for_zonal_operation(resp[0].latestResponse.name, conn)
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 12,
      next_step: 13,
      last_completed: 12,
      message: "Creating GCP Address",
      error: null,
      retry_id: retry_uuid,
      data: {
        key_file,
        zone,
        project,
        network_url,
        network_name,
        instance_url,
        temporary_public_url: temp_ip,
        id,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FETCHING",
      status: "IN-PROGRESS",
      step_number: 12,
      next_step: 13,
      last_completed: 12,
      message: "Creating GCP Address",
      error: null,
      retry_id: retry_uuid,
      data: {
        key_file,
        zone,
        project,
        network_url,
        network_name,
        instance_url,
        id,
        ...rest,
      },
    }
  }
}

export async function test_ssh({
  key_file,
  instance_url,
  project,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  try {
    const cmd = `gcloud compute ssh ${instance_url.split("/").at(-1)} \
    --command="lsb_release -i" \
    --account=${JSON.parse(key_file).client_email} \
    --tunnel-through-iap \
    --project=${project.trim()}`

    let { stderr, stdout } = await promiseExec(cmd)
    if (!stdout.trim().includes(`Distributor ID:`)) {
      throw new Error("Couldn't test ssh connection")
    }
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: GCP_STEPS.TEST_SSH,
      next_step: GCP_STEPS.TEST_SSH + 1,
      last_completed: GCP_STEPS.TEST_SSH,
      message: "Testing SSH connection to remote machine.",
      error: null,
      data: {
        key_file,
        instance_url,
        project,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: GCP_STEPS.TEST_SSH,
      next_step: GCP_STEPS.TEST_SSH,
      last_completed: GCP_STEPS.TEST_SSH - 1,
      message: `Couldn't connect to ssh. Please check if key was constructed`,
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        instance_url,
        project,
        ...rest,
      },
    }
  }
}

export async function push_files({
  key_file,
  source_private_ip,
  project,
  id,
  instance_url,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  const endpoint = "api/v1/log-request/single"
  const instance_name = instance_url.split("/").at(-1)
  try {
    let filepath_ingestor_out = path.normalize(
      `${__dirname}/../generics/scripts/metlo-ingestor-${id}.service`,
    )
    let filepath_ingestor_in = path.normalize(
      `${__dirname}/../generics/scripts/metlo-ingestor-template.service`,
    )
    let filepath_rules_out = path.normalize(
      `${__dirname}/../generics/scripts/local-${id}.rules`,
    )
    let filepath_rules_in = path.normalize(
      `${__dirname}/../generics/scripts/local.rules`,
    )

    put_data_file(
      format(filepath_ingestor_in, [`${process.env.BACKEND_URL}/${endpoint}`]),
      filepath_ingestor_out,
    )
    put_data_file(
      format(filepath_rules_in, [source_private_ip]),
      filepath_rules_out,
    )

    const fileMap = [
      path.normalize(`${__dirname}/../generics/scripts/install.sh`) +
        ` ${instance_name}:~/install.sh`,
      path.normalize(`${__dirname}/../generics/scripts/install-deps.sh`) +
        ` ${instance_name}:~/install-deps.sh`,
      path.normalize(`${__dirname}/../generics/scripts/suricata.yaml`) +
        ` ${instance_name}:~/suricata.yaml`,
      filepath_rules_out + ` ${instance_name}:"~/local.rules"`,
      filepath_ingestor_out + ` ${instance_name}:~/metlo-ingestor.service`,
    ]

    let pushes = fileMap.map(file => {
      return promiseExec(
        `gcloud compute scp ${file} \
      --account=${JSON.parse(key_file).client_email}\
      --tunnel-through-iap \
      --project=${project}`,
      )
    })
    let resp = await Promise.all(pushes)

    remove_file(filepath_ingestor_out)
    remove_file(filepath_rules_out)

    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: GCP_STEPS.PUSH_FILES,
      next_step: GCP_STEPS.PUSH_FILES + 1,
      last_completed: GCP_STEPS.PUSH_FILES,
      message: "Pushed configuration files to remote machine",
      error: null,
      data: {
        key_file,
        source_private_ip,
        project,
        id,
        instance_url,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: GCP_STEPS.PUSH_FILES,
      next_step: GCP_STEPS.PUSH_FILES,
      last_completed: GCP_STEPS.PUSH_FILES - 1,
      message: `Couldn't push configuration files to remote machine`,
      error: {
        err: JSON.stringify(err),
      },
      data: {
        key_file,
        source_private_ip,
        project,
        id,
        instance_url,
        ...rest,
      },
    }
  }
}

export async function execute_commands({
  instance_url,
  key_file,
  project,
  ...rest
}: RESPONSE["data"]): Promise<RESPONSE> {
  const instance_name = instance_url.split("/").at(-1)
  const acct_email = JSON.parse(key_file).client_email

  try {
    await promiseExec(
      `gcloud compute ssh ${instance_name} \
      --account=${acct_email} \
      --tunnel-through-iap \
      --project=${project} \
      --command="cd ~ && chmod +x install-deps.sh && ./install-deps.sh"`,
    )
    await promiseExec(
      `gcloud compute ssh ${instance_name} \
      --account=${JSON.parse(key_file).client_email} \
      --tunnel-through-iap \
      --project=${project} \
      --command="source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install.sh && ./install.sh"`,
    )

    return {
      success: "OK",
      status: "COMPLETE",
      step_number: GCP_STEPS.EXEC_COMMAND,
      next_step: GCP_STEPS.EXEC_COMMAND + 1,
      last_completed: GCP_STEPS.EXEC_COMMAND,
      message: "Executed configuration files on remote machine succesfully",
      error: null,
      data: {
        instance_url,
        key_file,
        project,
        ...rest,
      },
    }
  } catch (err) {
    console.log(err)
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: GCP_STEPS.EXEC_COMMAND,
      next_step: GCP_STEPS.EXEC_COMMAND,
      last_completed: GCP_STEPS.EXEC_COMMAND - 1,
      message: `Couldn't exec commands to install things`,
      error: {
        err: JSON.stringify(err),
      },
      data: {
        instance_url,
        key_file,
        project,
        ...rest,
      },
    }
  }
}

async function wait_for_global_operation(operation_id, conn: GCP_CONN) {
  return await AsyncRetry(
    async (f, at) => {
      let resp = await conn.get_global_operation_status(operation_id)
      if (resp[0].status === "DONE") {
        return resp
      } else {
        throw Error("Couldn't fetch global operation")
      }
    },
    { retries: 5 },
  )
}

async function wait_for_regional_operation(operation_id, conn: GCP_CONN) {
  return await AsyncRetry(
    async (f, at) => {
      let resp = await conn.get_regional_operation_status(operation_id)

      if (resp[0].status === "DONE") {
        return resp
      } else {
        throw Error("Couldn't fetch regional operation")
      }
    },
    { retries: 5 },
  )
}

async function wait_for_zonal_operation(operation_id, conn: GCP_CONN) {
  return await AsyncRetry(
    async (f, at) => {
      let resp = await conn.get_zonal_operation_status(operation_id)
      if (resp[0].status === "DONE") {
        return resp
      } else {
        throw Error("Couldn't fetch regional operation")
      }
    },
    { retries: 5 },
  )
}

export async function list_images({
  key_file,
  project,
  zone,
}: Partial<RESPONSE["data"]>) {
  let conn = new GCP_CONN(key_file, zone, project)
  let resps = await conn.list_machine_images({
    project: "ubuntu-os-cloud",
    filters: "id = 5824089035104633064",
  })
  return resps[0]
}

export async function list_machines({
  key_file,
  project,
  zone,
  minCpu,
  maxCpu,
  minMem,
  maxMem,
}: Partial<RESPONSE["data"]> & MachineSpecifications) {
  let conn = new GCP_CONN(key_file, zone, project)
  return (
    await conn.list_machine_types({
      filters: `memoryMb >=${minMem} AND memoryMb <= ${maxMem} AND guestCpus <= ${maxCpu} AND guestCpus >= ${minCpu}`,
    })
  )[0]
}
