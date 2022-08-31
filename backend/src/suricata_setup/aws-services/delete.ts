import { EC2Client } from "@aws-sdk/client-ec2"
import { STEP_RESPONSE } from "@common/types"
import { randomUUID } from "crypto"
import { EC2_CONN } from "./create-ec2-instance"
import {
  delete_mirror_filter,
  delete_mirror_session,
  delete_mirror_target,
} from "./mirroring"

export async function delete_aws_data(aws: STEP_RESPONSE["data"]) {
  let client = new EC2Client({
    credentials: {
      accessKeyId: aws.access_id,
      secretAccessKey: aws.secret_access_key,
    },
    region: aws.region,
  })
  // Delete EC2 Mirror Session
  try {
    await delete_mirror_session(client, aws.mirror_session_id, randomUUID())
  } catch (err) {
    throw new Error(
      `Couldn't delete EC2 Mirror Session ${aws.mirror_session_id}`,
    )
  }
  // Delete EC2 Mirror Filter
  try {
    await delete_mirror_filter(client, aws.mirror_filter_id, randomUUID())
  } catch (err) {
    throw new Error(`Couldn't delete EC2 Mirror Filter ${aws.mirror_filter_id}`)
  }
  // Delete EC2 Mirror Target
  try {
    await delete_mirror_target(client, aws.mirror_target_id, randomUUID())
  } catch (err) {
    throw new Error(`Couldn't delete EC2 Mirror Target ${aws.mirror_target_id}`)
  }

  let conn = new EC2_CONN(aws.access_id, aws.secret_access_key, aws.region)
  // Delete EC2 Instance
  try {
    await conn.delete_ec2_instance(aws.mirror_instance_id)
  } catch (err) {
    throw new Error(`Couldn't delete EC2 instance ${aws.mirror_instance_id}`)
  }
  // Delete EC2 Keypair
  try {
    await conn.delete_keypair(aws.keypair_id, aws.keypair_name)
  } catch (err) {
    throw new Error(`Couldn't delete EC2 Keyapair ${aws.keypair}`)
  }
  return `Deleted connection ${aws.id}`
}
