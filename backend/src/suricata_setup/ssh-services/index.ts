import { ConnectionType } from "@common/enums"
import { STEP_RESPONSE } from "@common/types"
import { randomUUID } from "crypto"
import { SSH_CONN, put_data_file, format, remove_file } from "./ssh-setup"

type RESPONSE = STEP_RESPONSE<ConnectionType.AWS>

export async function test_ssh({
  keypair,
  remote_machine_url,
  username,
  step,
  ...rest
}: RESPONSE["data"] & { step: number }): Promise<RESPONSE> {
  var conn
  try {
    conn = new SSH_CONN(keypair, remote_machine_url, username)
    await conn.test_connection()
    conn.disconnect()
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: step,
      next_step: step + 1,
      last_completed: step,
      message: "Testing SSH connection to remote machine.",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        username,
        ...rest,
      },
    }
  } catch (err) {
    if (conn && conn instanceof SSH_CONN) conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: step,
      next_step: step,
      last_completed: step - 1,
      message: `Couldn't connect to ssh. Please check if key was constructed`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        username,
        ...rest,
      },
    }
  }
}

export async function push_files({
  keypair,
  remote_machine_url,
  source_private_ip,
  username,
  step,
  ...rest
}: RESPONSE["data"] & { step: number }): Promise<RESPONSE> {
  const endpoint = "api/v1/log-request/single"
  let conn = new SSH_CONN(keypair, remote_machine_url, username)
  try {
    let filepath_ingestor = `${__dirname}/../generics/scripts/metlo-ingestor-${randomUUID()}.service`
    let filepath_rules = `${__dirname}/../generics/scripts/local-${randomUUID()}.rules`
    put_data_file(
      format(
        `${__dirname}/../generics/scripts/metlo-ingestor-template.service`,
        [`${process.env.BACKEND_URL}/${endpoint}`],
      ),
      filepath_ingestor,
    )
    put_data_file(
      format(`${__dirname}/../generics/scripts/local.rules`, [
        source_private_ip,
      ]),
      filepath_rules,
    )
    await conn.putfiles(
      [
        `${__dirname}/../generics/scripts/install.sh`,
        `${__dirname}/../generics/scripts/install-deps.sh`,
        filepath_rules,
        `${__dirname}/../generics/scripts/suricata.yaml`,
        filepath_ingestor,
      ],
      [
        "install.sh",
        "install-deps.sh",
        "local.rules",
        "suricata.yaml",
        "metlo-ingestor.service",
      ],
    )
    remove_file(filepath_ingestor)
    remove_file(filepath_rules)
    conn.disconnect()
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: step,
      next_step: step + 1,
      last_completed: step,
      message: "Pushed configuration files to remote machine",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        username,
        source_private_ip,
        ...rest,
      },
    }
  } catch (err) {
    conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: step,
      next_step: step,
      last_completed: step - 1,
      message: `Couldn't push configuration files to remote machine`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        username,
        source_private_ip,
        ...rest,
      },
    }
  }
}

export async function execute_commands({
  keypair,
  remote_machine_url,
  username,
  step,
  ...rest
}: RESPONSE["data"] & { step: number }): Promise<RESPONSE> {
  let conn = new SSH_CONN(keypair, remote_machine_url, username)
  try {
    await conn.run_command(
      "cd ~ && chmod +x install-deps.sh && ./install-deps.sh ",
    )
    await conn.run_command(
      "source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install.sh && ./install.sh ",
    )
    conn.disconnect()

    return {
      success: "OK",
      status: "COMPLETE",
      step_number: step,
      next_step: step + 1,
      last_completed: step,
      message: "Executed configuration files on remote machine succesfully",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        username,
        ...rest,
      },
    }
  } catch (err) {
    conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: step,
      next_step: step,
      last_completed: step - 1,
      message: `Couldn't exec commands to install things`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        username,
        ...rest,
      },
    }
  }
}
