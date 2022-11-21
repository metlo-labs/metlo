import {
  InstancesClient,
  SubnetworksClient,
  AddressesClient,
  GlobalAddressesClient,
  FirewallsClient,
  NetworksClient,
  RoutersClient,
  ImagesClient,
  InstanceTemplatesClient,
  InstanceGroupManagersClient,
  HealthChecksClient,
  RegionBackendServicesClient,
  ForwardingRulesClient,
  ZonesClient,
  PacketMirroringsClient,
  RegionOperationsClient,
  GlobalOperationsClient,
  ZoneOperationsClient,
  MachineTypesClient,
} from "@google-cloud/compute"
import { google } from "@google-cloud/compute/build/protos/protos"
import { wait_for_regional_operation } from "./gcpUtils"

const PREFIX_LENGTH = 24
const METLO_DATA_COLLECTOR_TAG = "metlo-capture"
const COOL_DOWN_PERIOD = 180

export class GCP_CONN {
  private zone: string
  private region: string
  private project: string
  private keyfile: Object

  constructor(key_file: Object | string, zone: string, project: string) {
    this.keyfile = key_file instanceof Object ? key_file : JSON.parse(key_file)
    this.zone = zone
    this.region = zone.substring(0, zone.length - 2)
    this.project = project
  }

  public async test_connection() {
    // We run `initialize` in get_conn, which tests the connection internally.
    let conn = new InstancesClient({ credentials: this.keyfile })
    conn.initialize()
  }

  public async get_zone({ zone }) {
    let conn = new ZonesClient({ credentials: this.keyfile })
    return conn.get({ zone, project: this.project })
  }

  public async get_networks({ name }) {
    let conn = new NetworksClient({ credentials: this.keyfile })
    return conn.get({ project: this.project, network: name })
  }

  public async get_regional_operation_status(operation: string) {
    let conn = new RegionOperationsClient({ credentials: this.keyfile })
    return conn.get({ operation, region: this.region, project: this.project })
  }

  public async get_zonal_operation_status(operation: string) {
    let conn = new ZoneOperationsClient({ credentials: this.keyfile })
    return conn.get({ operation, zone: this.zone, project: this.project })
  }

  public async get_global_operation_status(operation: string) {
    let conn = new GlobalOperationsClient({ credentials: this.keyfile })
    return conn.get({ operation, project: this.project })
  }

  public async get_instance(name: string) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    return conn.get({
      instance: name,
      project: this.project,
      zone: this.zone,
    })
  }

  public async get_instance_by_name({ instanceName }) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    const resp = conn.list({
      project: this.project,
      // zone: this.zone,
      filter: `name eq ${instanceName}`,
    })
    return resp
  }

  public async list_instances() {
    let conn = new InstancesClient({ credentials: this.keyfile })
    const resp = conn.list({
      project: this.project,
      zone: this.zone,
    })
    return resp
  }

  public async get_subnet_information({ subnetName }) {
    let conn = new SubnetworksClient({ credentials: this.keyfile })
    const resp = conn.get({
      project: this.project,
      subnetwork: subnetName,
      region: this.region,
    })
    return resp
  }

  public async get_address_information({ addressName }) {
    const resp = new GlobalAddressesClient({ credentials: this.keyfile }).get({
      project: this.project,
      address: addressName,
    })
    return resp
  }

  public async list_routers() {
    let conn = new RoutersClient({ credentials: this.keyfile })
    return conn.list({ region: this.region, project: this.project })
  }

  public async list_nats({ router }) {
    let conn = new RoutersClient({ credentials: this.keyfile })
    return conn.getNatMappingInfo({
      router,
      region: this.region,
      project: this.project,
    })
  }

  public async list_instance_for_group({ managedGroupName }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.listManagedInstances({
      instanceGroupManager: managedGroupName,
      zone: this.zone,
      project: this.project,
    })
  }

  public async list_machine_images({ project, filters }) {
    let conn = new ImagesClient({ credentials: this.keyfile })
    return conn.list({ project: project, filter: filters })
  }

  public async list_machine_types({ filters }) {
    let conn = new MachineTypesClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
      zone: this.zone,
      filter: filters,
    })
  }

  public async get_machine_types({ machineType }) {
    let conn = new MachineTypesClient({ credentials: this.keyfile })
    return conn.get({
      project: this.project,
      zone: this.zone,
      machineType,
    })
  }

  public async create_new_subnet({ name, ipCidr, network }) {
    let conn = new SubnetworksClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      region: this.region,
      subnetworkResource: {
        network,
        ipCidrRange: ipCidr,
        name,
      },
    })
  }

  public async create_new_internal_address({
    addressName,
    network,
    prefixLength,
  }) {
    const conn = new GlobalAddressesClient({ credentials: this.keyfile })
    let resp = conn.insert({
      project: this.project,
      addressResource: {
        region: this.region,
        name: addressName,
        prefixLength: prefixLength,
        addressType: "INTERNAL",
        purpose: "VPC_PEERING",
        network,
      },
    })
    return resp
  }

  public async create_inbound_firewall_rule({ firewallName, networkName }) {
    const conn = new FirewallsClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      firewallResource: {
        direction: "INGRESS",
        network: networkName,
        targetTags: [METLO_DATA_COLLECTOR_TAG],
        sourceRanges: ["0.0.0.0/0"],
        name: firewallName,
        priority: 65534,
        logConfig: {
          enable: false,
        },
        allowed: [
          {
            IPProtocol: "all"
          },
        ],
      },
    })
  }

  public async create_outbound_firewall_rule({ firewallName, networkName }) {
    const conn = new FirewallsClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      firewallResource: {
        direction: "EGRESS",
        network: networkName,
        targetTags: [METLO_DATA_COLLECTOR_TAG],
        sourceRanges: ["0.0.0.0/0"],
        name: firewallName,
        priority: 65534,
        logConfig: {
          enable: false,
        },
        allowed: [
          {
            IPProtocol: "all"
          },
        ],
      },
    })
  }

  public async create_router({ routerName, networkURL, subnetURL }) {
    let conn = new RoutersClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      region: this.region,
      routerResource: {
        region: this.region,
        name: routerName,
        network: networkURL,
        nats: [
          {
            natIpAllocateOption: "AUTO_ONLY",
            name: `${routerName}-nats`,
            subnetworks: [
              {
                sourceIpRangesToNat: ["PRIMARY_IP_RANGE"],
                name: subnetURL,
              },
            ],
            enableEndpointIndependentMapping: false,
            sourceSubnetworkIpRangesToNat: "LIST_OF_SUBNETWORKS",
          },
        ],
      },
    })
  }

  public async create_health_check({ healthCheckName }) {
    let conn = new HealthChecksClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      healthCheckResource: {
        unhealthyThreshold: 2,
        healthyThreshold: 2,
        checkIntervalSec: 30,
        timeoutSec: 10,
        name: healthCheckName,
        description: "METLO health check for backend",
        type: "TCP",
        tcpHealthCheck: {
          proxyHeader: null,
          port: 80,
        },
        logConfig: {
          enable: false,
        },
      },
    })
  }

  public async list_image_template() {
    let conn = new InstanceTemplatesClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
    })
  }

  public async create_image_template({
    machineType,
    sourceImage,
    network,
    subnet,
    imageTemplateName,
    startupScript,
  }) {
    let conn = new InstanceTemplatesClient({ credentials: this.keyfile })
    let script: string = startupScript || ""
    return conn.insert({
      project: this.project,
      instanceTemplateResource: {
        name: imageTemplateName,
        properties: {
          metadata: {
            items: [
              {
                key: "startup-script",
                value: script,
              },
            ],
          },
          machineType,
          disks: [
            {
              autoDelete: true,
              boot: true,
              deviceName: `${imageTemplateName}-disk`,
              diskEncryptionKey: {},
              initializeParams: {
                diskSizeGb: "10",
                diskType: "pd-balanced",
                labels: {},
                sourceImage: sourceImage,
              },
              mode: "READ_WRITE",
              type: "PERSISTENT",
            },
          ],
          networkInterfaces: [
            {
              network,
              subnetwork: subnet,
            },
          ],
          tags: {
            items: [METLO_DATA_COLLECTOR_TAG],
          },
        },
      },
    })
  }

  public async list_instance_manager() {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
      zone: this.zone,
    })
  }

  public async create_instance_manager({ templateURL, instanceName }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      zone: this.zone,
      instanceGroupManagerResource: {
        zone: this.zone,
        name: instanceName,
        instanceTemplate: templateURL,
        targetSize: 1,
      },
    })
  }

  public async create_instance({ instanceGroupURL, instance_name }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.createInstances({
      project: this.project,
      zone: this.zone,
      instanceGroupManager: instanceGroupURL,
      instanceGroupManagersCreateInstancesRequestResource: {
        instances: [{ name: instance_name }],
      },
    })
  }

  public async create_backend_service({
    networkURL,
    managedGroupURL,
    healthCheckURL,
    name,
  }) {
    let conn = new RegionBackendServicesClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      region: this.region,
      backendServiceResource: {
        name: name,
        region: this.region,
        network: networkURL,
        healthChecks: [healthCheckURL],
        loadBalancingScheme: "INTERNAL",
        backends: [{ group: managedGroupURL }],
        protocol: "TCP",
      },
    })
  }

  public async create_forwarding_rule({
    name,
    networkURL,
    subnetURL,
    backendServiceURL,
  }) {
    let conn = new ForwardingRulesClient({ credentials: this.keyfile })
    return conn.insert({
      region: this.region,
      project: this.project,
      forwardingRuleResource: {
        name,
        loadBalancingScheme: "INTERNAL",
        backendService: backendServiceURL,
        isMirroringCollector: true,
        network: networkURL,
        region: this.region,
        subnetwork: subnetURL,
        IPProtocol: "TCP",
        allPorts: true,
      },
    })
  }

  public async start_packet_mirroring({
    name,
    networkURL,
    mirroredInstanceURLs = [],
    mirroredSubnetURLS = [],
    mirroredTagURLs = [],
    loadBalancerURL,
  }) {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      region: this.region,
      packetMirroringResource: {
        name,
        collectorIlb: { url: loadBalancerURL },
        enable: "TRUE",
        network: {
          url: networkURL,
        },
        mirroredResources: {
          instances: mirroredInstanceURLs.map(url => ({
            url,
          })),
          subnetworks: mirroredSubnetURLS.map(url => ({
            url,
          })),
          tags: mirroredTagURLs,
        },
        region: this.region,
      },
    })
  }

  public async delete_subnet({ subnetURL }) {
    let conn = new SubnetworksClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      region: this.region,
      subnetwork: subnetURL,
    })
  }

  public async delete_new_address({ addressName }) {
    const conn = new GlobalAddressesClient({ credentials: this.keyfile })
    let resp = conn.delete({
      project: this.project,
      address: addressName,
    })
    return resp
  }

  public async list_firewall_rules() {
    const conn = new FirewallsClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project
    })
  }


  public async delete_firewall_rule({ firewallURL }) {
    const conn = new FirewallsClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      firewall: firewallURL,
    })
  }

  public async delete_router({ routerURL }) {
    let conn = new RoutersClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      region: this.region,
      router: routerURL,
    })
  }

  public async list_health_checks() {
    let conn = new HealthChecksClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
    })
  }

  public async delete_health_check({ healthCheckURL }) {
    let conn = new HealthChecksClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      healthCheck: healthCheckURL,
    })
  }

  public async delete_image_template({ templateURL }) {
    let conn = new InstanceTemplatesClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      instanceTemplate: templateURL,
    })
  }

  public async delete_instance_manager({ managerURL }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      zone: this.zone,
      instanceGroupManager: managerURL,
    })
  }

  public async delete_instance({ instanceGroupURL, instanceURL }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.deleteInstances({
      project: this.project,
      zone: this.zone,
      instanceGroupManager: instanceGroupURL,
      instanceGroupManagersDeleteInstancesRequestResource: {
        instances: [instanceURL],
      },
    })
  }

  public async list_backend_service() {
    let conn = new RegionBackendServicesClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
      region: this.region,
    })
  }

  public async delete_backend_service({ backendServiceURL }) {
    let conn = new RegionBackendServicesClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      region: this.region,
      backendService: backendServiceURL,
    })
  }

  public async delete_forwarding_rule({ forwardingRuleURL }) {
    let conn = new ForwardingRulesClient({ credentials: this.keyfile })
    return conn.delete({
      region: this.region,
      project: this.project,
      forwardingRule: forwardingRuleURL,
    })
  }

  public async stop_packet_mirroring({ packetMirroringURL }) {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    return conn.delete({
      project: this.project,
      region: this.region,
      packetMirroring: packetMirroringURL,
    })
  }

  public async list_packet_mirroring() {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    return conn.list({
      project: this.project,
      region: this.region
    })
  }

  public async get_packet_mirroring({ packetMirrorName }) {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    return conn.get({
      project: this.project,
      region: this.region,
      packetMirroring: packetMirrorName
    })
  }

  public async update_packet_mirroring({ packetMirrorName, updateInstance, updateTag, updateSubnet }: updatePacketMirroringInterface) {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    let [mirrorInfo, ,] = await this.get_packet_mirroring({ packetMirrorName })
    let updatedMirrorInfo: google.cloud.compute.v1.IPacketMirroring = {
      ...mirrorInfo, mirroredResources: {
        tags: updateTag ? [updateTag, ...mirrorInfo.mirroredResources.tags] : mirrorInfo.mirroredResources.tags,
        instances: updateInstance ? [updateInstance, ...mirrorInfo.mirroredResources.instances] : mirrorInfo.mirroredResources.instances,
        subnetworks: updateSubnet ? [updateSubnet, ...mirrorInfo.mirroredResources.subnetworks] : mirrorInfo.mirroredResources.subnetworks,
      }
    }
    return conn.patch({
      project: this.project,
      region: this.region,
      packetMirroring: packetMirrorName,
      packetMirroringResource: updatedMirrorInfo
    })
  }

  public async remove_packet_mirroring_resources({ packetMirrorName, newMirroredResources }: deletePacketMirroringResourcesInterface) {
    let conn = new PacketMirroringsClient({ credentials: this.keyfile })
    let [mirrorInfo, ,] = await this.get_packet_mirroring({ packetMirrorName })

    const [delOpRegional, ,] = await conn.delete({ project: this.project, region: this.region, packetMirroring: packetMirrorName })
    await wait_for_regional_operation(delOpRegional.latestResponse.name, this)
    if (
      newMirroredResources.instances.length == 0 &&
      newMirroredResources.subnetworks.length == 0 &&
      newMirroredResources.tags.length == 0
    ) {
      const [createOpRegional, ,] = await this.start_packet_mirroring({
        name: mirrorInfo.name,
        networkURL: mirrorInfo.network.url,
        mirroredInstanceURLs: [],
        mirroredSubnetURLS: [],
        mirroredTagURLs: ["metlo-provided-placeholder-network-tag"],
        loadBalancerURL: mirrorInfo.collectorIlb.url
      })
      await wait_for_regional_operation(createOpRegional.latestResponse.name, this)
    } else {
      const [createOpRegional, ,] = await this.start_packet_mirroring({
        name: mirrorInfo.name,
        networkURL: mirrorInfo.network.url,
        mirroredInstanceURLs: newMirroredResources.instances.map((inst) => inst.url),
        mirroredSubnetURLS: newMirroredResources.subnetworks.map((inst) => inst.url),
        mirroredTagURLs: newMirroredResources.tags,
        loadBalancerURL: mirrorInfo.collectorIlb.url
      })
      await wait_for_regional_operation(createOpRegional.latestResponse.name, this)
    }

    return
  }

}

interface updatePacketMirroringInterface {
  packetMirrorName: string;
  updateTag?: string;
  updateInstance?: google.cloud.compute.v1.IPacketMirroringMirroredResourceInfoInstanceInfo;
  updateSubnet?: google.cloud.compute.v1.IPacketMirroringMirroredResourceInfoSubnetInfo;
}

interface deletePacketMirroringResourcesInterface {
  packetMirrorName: string
  newMirroredResources: google.cloud.compute.v1.IPacketMirroringMirroredResourceInfo
}