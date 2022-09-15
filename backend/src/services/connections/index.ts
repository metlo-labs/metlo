import { ConnectionType } from "@common/enums"
import { AWS_CONNECTION, GCP_CONNECTION, SSH_INFO } from "@common/types"
import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { Connections } from "models"

const save_connection_aws = async ({
  conn_meta,
  name,
  id,
}: {
  conn_meta: AWS_CONNECTION & SSH_INFO
  name: string
  id: string
}) => {
  const {
    access_id,
    secret_access_key,
    mirror_source_id,
    source_type,
    region,
    ami,
    selected_instance_type,
    mirror_instance_id,
    mirror_session_id,
    mirror_target_id,
    mirror_filter_id,
    mirror_rules,
    keypair,
    destination_eni_id,
    backend_url,
    remote_machine_url,
    keypair_id,
    keypair_name,
  } = conn_meta
  const conn = new Connections()

  conn.aws = {
    access_id,
    secret_access_key,
    mirror_source_id,
    source_type,
    region,
    ami,
    selected_instance_type,
    mirror_instance_id,
    mirror_session_id,
    mirror_target_id,
    mirror_filter_id,
    mirror_rules,
    keypair,
    destination_eni_id,
    backend_url,
    remote_machine_url,
    keypair_name,
    keypair_id,
  } as AWS_CONNECTION & SSH_INFO
  conn.connectionType = ConnectionType.AWS
  conn.uuid = id
  conn.name = name
  try {
    const connectionRepository = AppDataSource.getRepository(Connections)
    await connectionRepository.save(conn)
  } catch (err) {
    console.error(`Error in saving connection: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const save_connection_gcp = async ({
  conn_meta,
  name,
  id,
}: {
  conn_meta: GCP_CONNECTION
  name: string
  id: string
}) => {
  const {
    key_file,
    project,
    zone,
    network_url,
    ip_range,
    source_subnetwork_url,
    firewall_rule_url,
    destination_subnetwork_url,
    router_url,
    machine_type,
    source_image,
    image_template_url,
    instance_url,
    managed_group_url,
    health_check_url,
    backend_service_url,
    forwarding_rule_url,
    source_instance_url,
    packet_mirror_url,
    mirror_source_value,
    source_type,
    source_private_ip,
  } = conn_meta
  const conn = new Connections()

  conn.gcp = {
    key_file,
    project,
    zone,
    network_url,
    ip_range,
    source_subnetwork_url,
    firewall_rule_url,
    destination_subnetwork_url,
    router_url,
    machine_type,
    source_image,
    image_template_url,
    instance_url,
    managed_group_url,
    health_check_url,
    backend_service_url,
    forwarding_rule_url,
    source_instance_url,
    packet_mirror_url,
    mirror_source_value,
    source_type,
    source_private_ip,
  } as GCP_CONNECTION
  conn.connectionType = ConnectionType.GCP
  conn.uuid = id
  conn.name = name
  try {
    const connectionRepository = AppDataSource.getRepository(Connections)
    await connectionRepository.save(conn)
  } catch (err) {
    console.error(`Error in saving connection: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const list_connections = async () => {
  try {
    const connectionRepository = AppDataSource.getRepository(Connections)
    let resp = await connectionRepository
      .createQueryBuilder("conn")
      .select([
        "conn.uuid",
        "conn.name",
        "conn.createdAt",
        "conn.updatedAt",
        "conn.connectionType",
        "conn.aws",
        "conn.gcp",
      ])
      .getMany()
    return resp
  } catch (err) {
    console.error(`Error in List Connections service: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const get_connection_for_uuid = async (
  uuid: string,
  with_metadata: boolean = false,
) => {
  try {
    const connectionRepository = AppDataSource.getRepository(Connections)
    const selects = [
      "conn.uuid",
      "conn.name",
      "conn.createdAt",
      "conn.updatedAt",
      "conn.connectionType",
      "conn.aws",
      "conn.gcp",
    ]
    if (with_metadata) {
      selects.push("conn.aws_meta")
      selects.push("conn.gcp_meta")
    }
    let resp = connectionRepository
      .createQueryBuilder("conn")
      .select(selects)
      .where("conn.uuid = :uuid", { uuid })
      .getOne()
    return await resp
  } catch (err) {
    console.error(`Error in List Connections service: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const update_connection_for_uuid = async ({
  name,
  uuid,
}: {
  name: string
  uuid: string
}) => {
  try {
    let resp = AppDataSource.createQueryBuilder()
      .update(Connections)
      .set({ name: name })
      .where("uuid = :uuid", { uuid })
      .execute()
    return await resp
  } catch (err) {
    console.error(`Error in List Connections service: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const delete_connection_for_uuid = async ({ uuid }) => {
  try {
    let resp = AppDataSource.createQueryBuilder()
      .delete()
      .from(Connections)
      .where("uuid = :uuid", { uuid })
      .execute()
    return await resp
  } catch (err) {
    console.error(`Error in Delete Connections service: ${err}`)
    throw new Error500InternalServer(err)
  }
}

const get_num_connections = async (): Promise<number> => {
  try {
    return await AppDataSource.getRepository(Connections).count()
  } catch (err) {
    console.error(`Error in Get Num Connections service: ${err}`)
    throw new Error500InternalServer(err)
  }
}

export {
  save_connection_aws,
  save_connection_gcp,
  list_connections,
  get_connection_for_uuid,
  update_connection_for_uuid,
  delete_connection_for_uuid,
  get_num_connections
}
