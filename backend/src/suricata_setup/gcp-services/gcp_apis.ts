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

  public async list_zones() {
    let conn = new ZonesClient({ credentials: this.keyfile })
    return conn.list()
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
      region: "us-west1",
    })
    return resp
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

  public async get_address_information({ addressName }) {
    const resp = new GlobalAddressesClient({ credentials: this.keyfile }).get({
      project: this.project,
      address: addressName,
    })
    return resp
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

  public async create_new_external_address({ addressName, network }) {
    const conn = new AddressesClient({ credentials: this.keyfile })
    let resp = conn.insert({
      project: this.project,
      region: this.region,
      addressResource: {
        region: this.region,
        name: addressName,
        addressType: "EXTERNAL",
        network,
      },
    })
    return resp
  }

  public async get_external_address({ addressName }) {
    let conn = new AddressesClient({ credentials: this.keyfile })
    return conn.get({
      project: this.project,
      address: addressName,
      region: this.region,
    })
  }

  public async attach_external_ip({ instanceURL, address }) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    let instance = await conn.get({
      zone: this.zone,
      project: this.project,
      instance: instanceURL,
    })
    return conn.addAccessConfig({
      zone: this.zone,
      project: this.project,
      instance: instanceURL,
      networkInterface: instance[0].networkInterfaces[0].name,
      accessConfigResource: {
        natIP: address,
        name: `${instance[0].name}-EX_ADDR`,
      },
    })
  }

  public async detach_external_ip({ instanceURL }) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    let instance = await conn.get({
      zone: this.zone,
      project: this.project,
      instance: instanceURL,
    })

    return conn.deleteAccessConfig({
      zone: this.zone,
      project: this.project,
      instance: instanceURL,
      networkInterface: instance[0].networkInterfaces[0].name,
      accessConfig: `${instance[0].name}-EX_ADDR`,
    })
  }

  public async describe_new_address({ addressName }) {
    const conn = new GlobalAddressesClient({ credentials: this.keyfile })
    let resp = conn.get({
      project: this.project,
      address: addressName,
    })
    return resp
  }

  public async delete_new_address({ addressName }) {
    const conn = new GlobalAddressesClient({ credentials: this.keyfile })
    let resp = conn.delete({
      project: this.project,
      address: addressName,
    })
    return resp
  }

  public async create_firewall_rule({ firewallName, networkName, ipRange }) {
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
            IPProtocol: "all",
          },
        ],
      },
    })
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

  public async create_image_template({
    machineType,
    sourceImage,
    network,
    subnet,
    imageTemplateName,
  }) {
    let conn = new InstanceTemplatesClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      instanceTemplateResource: {
        name: imageTemplateName,
        properties: {
          metadata: {
            items: [
              {
                key: "startup-script",
                value: `#! /bin/bash
            apt-get update
            apt-get install apache2 -y
            vm_hostname="$(curl -H "Metadata-Flavor:Google" \
            http://169.254.169.254/computeMetadata/v1/instance/name)"
            echo "Page served from: $vm_hostname" | \
            tee /var/www/html/index.html
            systemctl restart apache2`,
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

  public async list_instance_for_group({ managedGroupName }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.listManagedInstances({
      instanceGroupManager: managedGroupName,
      zone: this.zone,
      project: this.project,
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

  public async add_key({ username, publicKey, instance }) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    let project_metadata = await conn.get({
      project: this.project,
      instance: instance,
      zone: this.zone,
    })
    let project_fingerprint = project_metadata[0].metadata.fingerprint

    let project_meta_without_ssh = project_metadata[0].metadata.items.filter(
      v => v.key !== "ssh-keys",
    )

    let ssh_keys = project_metadata[0].metadata.items.find(
      v => v.key === "ssh-keys",
    )
    return conn.setMetadata({
      instance,
      zone: this.zone,
      project: this.project,
      metadataResource: {
        fingerprint: project_fingerprint,
        items: [
          ...project_meta_without_ssh,
          {
            key: "ssh-keys",
            value: `${ssh_keys.value}\n${username}:${publicKey}`,
          },
        ],
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

  // public async add_backend({
  //   backendServiceName,
  //   managedGroupURL,
  //   healthCheckURL,
  // }) {
  //   let conn = new RegionBackendServicesClient({ credentials: this.keyfile })
  //   return await conn.update({
  //     project: this.project,
  //     region: this.region,
  //     backendService: backendServiceName,
  //     backendServiceResource: {
  //       region: this.region,
  //       backends: [{ group: managedGroupURL }],
  //       healthChecks: healthCheckURL ? [healthCheckURL] : [],
  //       loadBalancingScheme: "INTERNAL",
  //     },
  //   })
  // }

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
}
