import {
  EC2Client,
  DescribeInstanceTypesCommand,
  DescribeInstanceTypesCommandInput,
  DescribeInstancesCommand,
  DescribeNetworkInterfacesCommand,
} from "@aws-sdk/client-ec2"

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
}
