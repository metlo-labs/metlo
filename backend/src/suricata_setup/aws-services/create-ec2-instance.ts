import {
  EC2Client,
  DescribeImagesCommand,
  DescribeImagesCommandInput,
  DescribeImagesCommandOutput,
  EC2ClientConfig,
  RunInstancesCommand,
  RunInstancesCommandInput,
  RunInstancesCommandOutput,
  DescribeInstanceTypesCommand,
  DescribeInstanceTypesCommandInput,
  GetInstanceTypesFromInstanceRequirementsCommand,
  GetInstanceTypesFromInstanceRequirementsCommandInput,
  InstanceTypeInfoFromInstanceRequirements,
  CreateKeyPairCommand,
  CreateKeyPairCommandInput,
  DescribeKeyPairsCommand,
  DescribeKeyPairsCommandInput,
  Image,
  KeyType,
  CreateKeyPairCommandOutput,
  VirtualizationType,
  CreateSecurityGroupCommand,
  CreateSecurityGroupCommandInput,
  AuthorizeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupIngressCommandInput,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
  DeleteKeyPairCommand,
} from "@aws-sdk/client-ec2";

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"

import { MachineSpecifications } from "@common/types"
// For pricing approximation
// import {
//   Pricing
//   PricingClientConfig,
//   GetProductsCommand,
// } from "@aws-sdk/client-pricing";

const supported_instances = [
  "a1",
  "c5",
  "c5a",
  "c5ad",
  "c5d",
  "c5n",
  "c6a",
  "c6g",
  "c6gd",
  "c6gn",
  "c6i",
  "c6id",
  "d3",
  "d3en",
  "dl1",
  "g4",
  "g4ad",
  "g5",
  "g5g",
  "hpc6a",
  "i3en",
  "i4i",
  "im4gn",
  "inf1",
  "is4gen",
  "m5",
  "m5a",
  "m5ad",
  "m5d",
  "m5dn",
  "m5n",
  "m5zn",
  "m6a",
  "m6g",
  "m6gd",
  "m6i",
  "m6id",
  "p3dn.24xlarge",
  "p4",
  "r5",
  "r5a",
  "r5ad",
  "r5b",
  "r5d",
  "r5dn",
  "r5n",
  "r6a",
  "r6g",
  "r6gd",
  "r6i",
  "r6id",
  "t3",
  "t3a",
  "t4g",
  "u-6tb1.56xlarge",
  "u-6tb1.112xlarge",
  "u-9tb1.112xlarge",
  "u-12tb1.112xlarge",
  "vt1",
  "x2gd",
  "x2idn",
  "x2iedn",
  "x2iezn",
  "z1d",
  "a1.metal",
  "c5.metal",
  "c5d.metal",
  "c5n.metal",
  "c6a.metal",
  "c6g.metal",
  "c6gd.metal",
  "c6i.metal",
  "c6id.metal",
  "g4dn.metal",
  "g5g.metal",
  "i3.metal",
  "i3en.metal",
  "i4i.metal",
  "m5.metal",
  "m5d.metal",
  "m5dn.metal",
  "m5n.metal",
  "m5zn.metal",
  "m6a.metal",
  "m6g.metal",
  "m6gd.metal",
  "m6i.metal",
  "m6id.metal",
  "mac1.metal",
  "r5.metal",
  "r5b.metal",
  "r5d.metal",
  "r5dn.metal",
  "r5n.metal",
  "r6a.metal",
  "r6g.metal",
  "r6gd.metal",
  "r6i.metal",
  "r6id.metal",
  "u-6tb1.metal",
  "u-9tb1.metal",
  "u-12tb1.metal",
  "u-18tb1.metal",
  "u-24tb1.metal",
  "x2gd.metal",
  "x2idn.metal",
  "x2iedn.metal",
  "x2iezn.metal",
  "z1d.metal",
]

export class EC2_CONN {
  private access_id: string
  private secret_key: string
  private region?: string
  private conn: EC2Client
  constructor(access_id: string, secret_key: string, region?: string) {
    this.access_id = access_id
    this.secret_key = secret_key
    this.region = region
  }

  public get_conn() {
    if (this.conn) {
      return this.conn
    }
    this.conn = new EC2Client({
      credentials: {
        accessKeyId: this.access_id,
        secretAccessKey: this.secret_key,
      },
      region: this.region,
    })
    return this.conn
  }

  public disconnect() {
    if (this.conn) this.conn.destroy()
  }

  public async get_caller_identity() {
    let sts_conn = new STSClient({
      credentials: {
        accessKeyId: this.access_id,
        secretAccessKey: this.secret_key,
      },
    })
    sts_conn.send(new GetCallerIdentityCommand({}))
  }

  public async get_all_images(img_names: Array<string>): Promise<Array<Image>> {
    // Create an Amazon EC2 service client object.
    const input: DescribeImagesCommandInput = {
      Filters: [
        { Name: "architecture", Values: ["x86_64"] },
        { Name: "is-public", Values: ["true"] },
        { Name: "image-type", Values: ["machine"] },
        { Name: "state", Values: ["available"] },
        {
          Name: "name",
          Values: img_names,
        },
      ],
      Owners: ["099720109477"],
      IncludeDeprecated: false,
    }
    const command = new DescribeImagesCommand(input)
    const response = await this.get_conn().send(command)
    return response.Images.sort(
      (a, b) =>
        new Date(a.CreationDate).getTime() - new Date(b.CreationDate).getTime(),
    )
  }

  public async get_latest_image(
    img_names: Array<string> = [
      "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-????????",
    ],
  ) {
    let resp = (await this.get_all_images(img_names)).pop()
    return resp
  }

  public async describe_instance(ec2_instance_id) {
    let resp = await this.get_conn().send(
      new DescribeInstancesCommand({ InstanceIds: [ec2_instance_id] }),
    )
    return resp
  }

  public async image_from_ami(ami: string) {
    const input: DescribeImagesCommandInput = {
      Filters: [
        { Name: "architecture", Values: ["x86_64"] },
        { Name: "is-public", Values: ["true"] },
        { Name: "image-type", Values: ["machine"] },
        { Name: "state", Values: ["available"] },
      ],
      ImageIds: [ami],
      IncludeDeprecated: false,
    }
    const command = new DescribeImagesCommand(input)
    const response = await this.get_conn().send(command)
    return response.Images.sort(
      (a, b) =>
        new Date(a.CreationDate).getTime() - new Date(b.CreationDate).getTime(),
    )
  }

  public async get_valid_types(
    vtx_type: VirtualizationType,
    specs: MachineSpecifications,
  ): Promise<Array<InstanceTypeInfoFromInstanceRequirements>> {
    let command = new GetInstanceTypesFromInstanceRequirementsCommand({
      ArchitectureTypes: ["x86_64"],
      VirtualizationTypes: [vtx_type],
      InstanceRequirements: {
        VCpuCount: { Min: specs.minCpu, Max: specs.maxCpu },
        MemoryMiB: {
          Min: specs.minMem * 1024,
          Max: specs.maxMem ? specs.maxMem * 1024 : null,
        },
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
      let a = supported_instances.filter(y => x.InstanceType.includes(y))
      return a.length > 0
    })
  }

  public async describe_type(Instance_type: string) {
    let command = new DescribeInstanceTypesCommand({
      InstanceTypes: [Instance_type],
    } as DescribeInstanceTypesCommandInput)
    let resp = await this.get_conn().send(command)
    return resp.InstanceTypes[0]
  }

  // TODO : Pricing API gives somewhat random results.
  // As in, systems with linux come out to $0.00 per hour
  // async function get_pricing(
  //   config: PricingClientConfig,
  //   instance_type: string,
  //   location: string
  // ) {
  //   let client = new PricingClient(config);
  //   let command = new GetProductsCommand({
  //     Filters: [
  //       { Field: "instanceType", Type: "TERM_MATCH", Value: instance_type },
  //       { Field: "location", Type: "TERM_MATCH", Value: location },
  //     ],
  //     FormatVersion: "aws_v1",
  //     ServiceCode: "AmazonEC2",
  //   });
  //   let resp = await this.get_conn().send(command);
  //   return resp;
  // }

  public async create_new_keypair(name: string) {
    let command = new CreateKeyPairCommand({
      KeyName: name,
      KeyType: KeyType.ed25519,
      TagSpecifications: [
        {
          ResourceType: "key-pair",
          Tags: [{ Key: "Created By", Value: "Metlo" }],
        },
      ],
    } as CreateKeyPairCommandInput)
    let resp = await this.get_conn().send(command)
    return resp
  }

  public async list_keypairs() {
    let command = new DescribeKeyPairsCommand(
      {} as DescribeKeyPairsCommandInput,
    )
    let resp = await this.get_conn().send(command)
    return resp
  }

  public async create_security_group(id: string) {
    let command = new CreateSecurityGroupCommand({
      GroupName: id,
      Description:
        "Default security group created by METLO for mirror instance",
    } as CreateSecurityGroupCommandInput)
    let resp = await this.get_conn().send(command)
    return resp
  }

  public async create_security_group_ingress(
    security_group_id: string,
    protocol: string,
    port: number,
  ) {
    let command = new AuthorizeSecurityGroupIngressCommand({
      GroupId: security_group_id,
      IpProtocol: protocol,
      FromPort: port,
      ToPort: port,
      CidrIp: "0.0.0.0/0",
      TagSpecifications: [
        {
          ResourceType: "security-group-rule",
          Tags: [{ Key: "Created By", Value: "Created by METLO" }],
        },
      ],
    })
    let resp = await this.get_conn().send(command)
    return resp
  }

  public async create_new_instance(
    instance_ami: string,
    instance_type: string,
    id: string,
  ): Promise<[RunInstancesCommandOutput, CreateKeyPairCommandOutput]> {
    const key = await this.create_new_keypair(`METLO-Instance-${id}-Key`)
    const security_group = await this.create_security_group(
      `METLO-SECURITY-GROUP-${id}`,
    )
    await this.create_security_group_ingress(security_group.GroupId, "tcp", 22)
    await this.create_security_group_ingress(
      security_group.GroupId,
      "udp",
      4789,
    )
    const command = new RunInstancesCommand({
      MaxCount: 1,
      MinCount: 1,
      ImageId: instance_ami,
      InstanceType: instance_type,
      KeyName: key.KeyName,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            {
              Key: "Name",
              Value: `METLO-Mirror-instance-${id}`,
            },
            { Key: "Created By", Value: "Metlo" },
          ],
        },
        {
          ResourceType: "volume",
          Tags: [
            {
              Key: "Name",
              Value: `METLO-Mirror-volume-${id}`,
            },
            { Key: "Created By", Value: "Metlo" },
          ],
        },
      ],
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/sda1",
          Ebs: {
            DeleteOnTermination: true,
            VolumeSize: 8,
            VolumeType: "gp2",
            Encrypted: true,
          },
        },
      ],
    } as RunInstancesCommandInput)
    const response = await this.get_conn().send(command)
    return [response, key]
  }

  public async delete_ec2_instance(instance_id: string) {
    let conn = this.get_conn();
    await conn.send(
      new TerminateInstancesCommand({ InstanceIds: [instance_id] })
    );
    return true;
  }
  
  public async delete_keypair(keypair_id: string) {
    let conn = this.get_conn();
    await conn.send(new DeleteKeyPairCommand({ KeyPairId: keypair_id }));
    return true;
  }
}
