import compute, {
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
  AutoscalersClient,
} from "@google-cloud/compute"

const PREFIX_LENGTH = 24
const METLO_DATA_COLLECTOR_TAG = "metlo-capture"
const COOL_DOWN_PERIOD = 180

export class GCP_CONN {
  private zone: string
  private region: string
  private project: string
  private keyfile: Object

  constructor(key_file: Object, zone: string, project: string) {
    this.keyfile = key_file
    this.zone = zone
    this.region = zone.substring(0, zone.length - 2)
    this.project = project
  }

  public async test_connection() {
    try {
      // We run `initialize` in get_conn, which tests the connection internally.
      let conn = new InstancesClient({ credentials: this.keyfile })
      conn.initialize()
      return true
    } catch (err) {
      return false
    }
  }

  public async list_instances() {
    let conn = new InstancesClient({ credentials: this.keyfile })
    return conn.list({ project: this.project, zone: this.zone })
  }

  public async get_instance_by_name({ instanceName }) {
    let conn = new InstancesClient({ credentials: this.keyfile })
    const resp = conn.list({
      project: this.project,
      zone: this.zone,
      filter: `name eq ${instanceName}`,
    })
    return resp
  }

  public async get_subnet_information({ subnetName }) {
    let conn = new SubnetworksClient({ credentials: this.keyfile })
    const resp = conn.get({
      project: this.project,
      subnetwork: "default",
      region: "us-west1",
    })
    return resp
  }

  public async get_address_information({ addressName }) {
    const resp = new AddressesClient({ credentials: this.keyfile }).get({
      project: this.project,
      address: addressName,
      region: "us-west1",
    })
    return resp
  }

  public async create_new_address({ addressName, network }) {
    const conn = new GlobalAddressesClient({ credentials: this.keyfile })
    let resp = conn.insert({
      project: this.project,
      addressResource: {
        name: addressName,
        prefixLength: PREFIX_LENGTH,
        network,
      },
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

  public async create_firewall({ firewallName, networkName, ipRange }) {
    const conn = new FirewallsClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      firewallResource: {
        network: networkName,
        targetTags: [METLO_DATA_COLLECTOR_TAG],
        sourceRanges: [ipRange],
        name: firewallName,
        priority: 65534,
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
            name: `${routerName}-nats`,
            sourceSubnetworkIpRangesToNat: "LIST_OF_SUBNETWORKS",
            subnetworks: [{ name: subnetURL }],
            natIpAllocateOption: "AUTO_ONLY",
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
          port: 22,
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
              boot: true,
              initializeParams: { sourceImage: sourceImage, diskSizeGb: 10 },
            },
          ],
          networkInterfaces: [
            {
              network,
              subnetwork: subnet,
            },
          ],
          tags: {
            items: ["http-server", "https-server", METLO_DATA_COLLECTOR_TAG],
          },
        },
      },
    })
  }

  public async create_managed_instance({
    templateUrl,
    healthCheckURL,
    instanceName,
  }) {
    let conn = new InstanceGroupManagersClient({ credentials: this.keyfile })
    return conn.insert(
      {
        project: this.project,
        zone: this.zone,
        instanceGroupManagerResource: {
          region: this.region,
          zone: this.zone,
          name: instanceName,
          instanceTemplate: templateUrl,
          targetSize: 1,
          autoHealingPolicies: [
            {
              healthCheck: healthCheckURL,
              initialDelaySec: COOL_DOWN_PERIOD,
            },
          ],
        },
      },
      {},
    )
  }

  public async create_auto_scaling({
    managedGroupURL,
    scalingGroupName,
    maxReplicas,
    minReplicas,
  }) {
    let conn = new AutoscalersClient({ credentials: this.keyfile })
    return conn.insert({
      project: this.project,
      zone: this.zone,
      autoscalerResource: {
        target: managedGroupURL,
        name: scalingGroupName,
        autoscalingPolicy: {
          maxNumReplicas: maxReplicas,
          minNumReplicas: minReplicas,
          coolDownPeriodSec: COOL_DOWN_PERIOD,
        },
      },
    })
  }
}
