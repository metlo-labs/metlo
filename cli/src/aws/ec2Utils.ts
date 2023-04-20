import {
  EC2Client,
  DescribeInstanceTypesCommand,
  DescribeInstanceTypesCommandInput,
  DescribeInstancesCommand,
  VirtualizationType,
  DescribeNetworkInterfacesCommand,
  InstanceTypeInfoFromInstanceRequirements,
  GetInstanceTypesFromInstanceRequirementsCommand,
  GetInstanceTypesFromInstanceRequirementsCommandInput,
  DescribeInstancesCommandInput,
  Filter,
} from "@aws-sdk/client-ec2"
import {
  ECSClient,
  DescribeTasksCommand,
  DescribeServicesCommand,
  DescribeClustersCommand,
  ListClustersCommand,
  ListServicesCommand,
  ListTasksCommand,
  DescribeClustersCommandInput,
  DescribeServicesCommandInput,
  DescribeTasksCommandInput,
} from "@aws-sdk/client-ecs"
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2"
import chalk from "chalk"
import { SUPPORTED_AWS_INSTANCES } from "./constants"
import { MachineSpecifications } from "./types"
import { changePrintDebug, shouldPrintDebug } from "../utils"

export const getEC2Client = (region?: string) => {
  if (
    process.env.METLO_AWS_ACCESS_KEY_ID &&
    process.env.METLO_AWS_SECRET_ACCESS_KEY
  ) {
    if (shouldPrintDebug || process.env.DEBUG) {
      console.log(
        chalk.bold.dim(
          `Using credentials in "METLO_AWS_ACCESS_KEY_ID" and "METLO_AWS_SECRET_ACCESS_KEY" for EC2 Client.`,
        ),
      )
      changePrintDebug()
    }
    return new EC2Client({
      region,
      credentials: {
        accessKeyId: process.env.METLO_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.METLO_AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return new EC2Client({ region })
}

export const getECSClient = (region?: string) => {
  if (
    process.env.METLO_AWS_ACCESS_KEY_ID &&
    process.env.METLO_AWS_SECRET_ACCESS_KEY
  ) {
    if (shouldPrintDebug || process.env.DEBUG) {
      console.log(
        chalk.bold.dim(
          `Using credentials in "METLO_AWS_ACCESS_KEY_ID" and "METLO_AWS_SECRET_ACCESS_KEY" for EC2 Client.`,
        ),
      )
      changePrintDebug()
    }
    return new ECSClient({
      region,
      credentials: {
        accessKeyId: process.env.METLO_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.METLO_AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return new ECSClient({ region })
}

export const getELBClient = (region?: string) => {
  if (
    process.env.METLO_AWS_ACCESS_KEY_ID &&
    process.env.METLO_AWS_SECRET_ACCESS_KEY
  ) {
    if (shouldPrintDebug || process.env.DEBUG) {
      console.log(
        chalk.bold.dim(
          `Using credentials in "METLO_AWS_ACCESS_KEY_ID" and "METLO_AWS_SECRET_ACCESS_KEY" for EC2 Client.`,
        ),
      )
      changePrintDebug()
    }
    return new ElasticLoadBalancingV2Client({
      region,
      credentials: {
        accessKeyId: process.env.METLO_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.METLO_AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return new ElasticLoadBalancingV2Client({ region })
}

export class EC2_CONN {
  private region?: string
  private conn: EC2Client

  constructor(region?: string) {
    this.region = region
  }

  public get_conn() {
    if (this.conn) {
      return this.conn
    }
    this.conn = getEC2Client(this.region)
    return this.conn
  }

  public disconnect() {
    if (this.conn) this.conn.destroy()
  }

  public async describe_instance(ec2_instance_id?: string) {
    const data = {
      Filters: [{ Name: "instance-state-name", Values: ["running"] }],
    } as DescribeInstancesCommandInput
    if (ec2_instance_id) {
      data["InstanceIds"] = [ec2_instance_id]
    }
    let resp = await this.get_conn().send(new DescribeInstancesCommand(data))
    return resp
  }

  public async describe_interface(ec2_interface_id?: string) {
    const data = {}
    if (ec2_interface_id) {
      data["InstanceIds"] = [ec2_interface_id]
    }
    let resp = await this.get_conn().send(
      new DescribeNetworkInterfacesCommand(data),
    )
    return resp
  }

  public async describe_type(Instance_type: string) {
    let command = new DescribeInstanceTypesCommand({
      InstanceTypes: [Instance_type],
    } as DescribeInstanceTypesCommandInput)
    let resp = await this.get_conn().send(command)
    return resp.InstanceTypes[0]
  }

  public async get_valid_types(
    specs?: MachineSpecifications,
    vtx_type?: VirtualizationType,
  ): Promise<Array<InstanceTypeInfoFromInstanceRequirements>> {
    let command = new GetInstanceTypesFromInstanceRequirementsCommand({
      ArchitectureTypes: ["x86_64"],
      VirtualizationTypes: vtx_type ? [vtx_type] : ["hvm", "paravirtual"],
      InstanceRequirements: {
        VCpuCount: specs
          ? { Min: specs.minCpu, Max: specs.maxCpu }
          : { Min: 0 },
        MemoryMiB: specs
          ? {
              Min: specs.minMem * 1024,
              Max: specs.maxMem ? specs.maxMem * 1024 : null,
            }
          : { Min: 0 },
        InstanceGenerations: ["current"],
        BurstablePerformance: "included",
        BareMetal: "included",
        ExcludedInstanceTypes: [
          "t2.nano",
          "t2.micro",
          "t2.small",
          "t2.medium",
          "t2.large",
          "t2.xlarge",
          "t2.2xlarge",
          "c3.large",
          "c3.xlarge",
          "c3.2xlarge",
          "c3.4xlarge",
          "c3.8xlarge",
          "r3.large",
          "r3.xlarge",
          "r3.2xlarge",
          "r3.4xlarge",
          "r3.8xlarge",
          "i3.xlarge",
          "i3.2xlarge",
          "i3.4xlarge",
          "i3.8xlarge",
        ],
      },
    } as GetInstanceTypesFromInstanceRequirementsCommandInput)
    let conn = this.get_conn()
    let resp = await conn.send(command)
    return resp.InstanceTypes.filter(x => {
      let a = SUPPORTED_AWS_INSTANCES.filter(y => x.InstanceType.includes(y))
      return a.length > 0
    })
  }

  public async list_eni(filters: Filter[]) {
    let resp = await this.get_conn().send(
      new DescribeNetworkInterfacesCommand({ Filters: filters }),
    )
    return resp
  }
}

export class ELB_CONN {
  private region?: string
  private conn: ElasticLoadBalancingV2Client

  constructor(region?: string) {
    this.region = region
  }

  public get_conn() {
    if (this.conn) {
      return this.conn
    }
    this.conn = getELBClient(this.region)
    return this.conn
  }

  public disconnect() {
    if (this.conn) this.conn.destroy()
  }

  public async list_albs() {
    let resp = await this.get_conn().send(new DescribeLoadBalancersCommand({}))
    return resp
  }
}

export class ECS_CONN {
  private region?: string
  private conn: ECSClient

  constructor(region?: string) {
    this.region = region
  }

  public get_conn() {
    if (this.conn) {
      return this.conn
    }
    this.conn = getECSClient(this.region)
    return this.conn
  }

  public disconnect() {
    if (this.conn) this.conn.destroy()
  }

  public async list_ecs_clusters() {
    let resp = await this.get_conn().send(new ListClustersCommand({}))
    return resp
  }

  public async list_ecs_services(clusterARN: string) {
    let resp = await this.get_conn().send(
      new ListServicesCommand({ cluster: clusterARN }),
    )
    return resp
  }

  public async list_ecs_tasks(clusterARN: string, serviceName: string) {
    let resp = await this.get_conn().send(
      new ListTasksCommand({ cluster: clusterARN, serviceName }),
    )
    return resp
  }

  public async describe_ecs_tasks(
    clusterARN: string,
    serviceName?: string,
    taskARN?: string | Array<string>,
  ) {
    const data: DescribeTasksCommandInput = {
      tasks: [],
      cluster: clusterARN,
    }
    if (taskARN) {
      data.tasks = Array.isArray(taskARN) ? taskARN : [taskARN]
    } else {
      data.tasks = (await this.list_ecs_tasks(clusterARN, serviceName)).taskArns
    }
    let resp = await this.get_conn().send(new DescribeTasksCommand(data))
    return resp
  }

  public async describe_ecs_services(
    clusterARN: string,
    services?: Array<string>,
  ) {
    const data: DescribeServicesCommandInput = {
      services: undefined,
      cluster: clusterARN,
    }
    if (services) {
      data.services = services
    } else {
      data.services = (await this.list_ecs_services(clusterARN)).serviceArns
    }
    let resp = await this.get_conn().send(new DescribeServicesCommand(data))
    return resp
  }

  public async describe_ecs_clusters(clusters?: Array<string>) {
    const data: DescribeClustersCommandInput = {}
    if (clusters) {
      data.clusters = clusters
    } else {
      data.clusters = (await this.list_ecs_clusters()).clusterArns
    }
    let resp = await this.get_conn().send(new DescribeClustersCommand(data))
    return resp
  }
}
