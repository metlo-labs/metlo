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
} from "@aws-sdk/client-ec2"
import { SUPPORTED_AWS_INSTANCES } from "./constants"
import { MachineSpecifications } from "./types"

export const getEC2Client = (region?: string) => {
  return new EC2Client({ region })
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

  public async describe_instance(ec2_instance_id) {
    let resp = await this.get_conn().send(
      new DescribeInstancesCommand({ InstanceIds: [ec2_instance_id] }),
    )
    return resp
  }

  public async describe_interface(ec2_interface_id) {
    let resp = await this.get_conn().send(
      new DescribeNetworkInterfacesCommand({
        NetworkInterfaceIds: [ec2_interface_id],
      }),
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
}
