import { STEP_RESPONSE } from "@common/types"
import { randomUUID } from "crypto"
import { SSH_CONN, put_data_file, format, remove_file } from "./ssh-setup"

export async function test_ssh({
  keypair,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  var conn
  try {
    conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu")
    await conn.test_connection()
    conn.disconnect()
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 11,
      last_completed: 10,
      message: "Testing SSH connection to remote machine.",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  } catch (err) {
    if (conn && conn instanceof SSH_CONN) conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 10,
      next_step: 11,
      last_completed: 9,
      message: `Couldn't connect to ssh. Please check if key was constructed`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  }
}

export async function push_files({
  keypair,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  const endpoint = "/api/v1/log-request/batch"
  let conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu")
  try {
    let filepath = `${__dirname}/../generics/scripts/metlo-ingestor-${randomUUID()}.service`
    put_data_file(
      format(
        `${__dirname}/../generics/scripts/metlo-ingestor-template.service`,
        [`${process.env.BACKEND_URL}/${endpoint}`],
      ),
      filepath,
    )
    await conn.putfiles(
      [
        `${__dirname}/../generics/scripts/install.sh`,
        `${__dirname}/../generics/scripts/install-nvm.sh`,
        `${__dirname}/../generics/scripts/local.rules`,
        `${__dirname}/../generics/scripts/suricata.yaml`,
        filepath,
      ],
      [
        "install.sh",
        "install-nvm.sh",
        "local.rules",
        "suricata.yaml",
        "metlo-ingestor.service",
      ],
    )
    remove_file(filepath)
    conn.disconnect()
    return {
      success: "OK",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 12,
      last_completed: 11,
      message: "Pushed configuration files to remote machine",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  } catch (err) {
    conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 11,
      next_step: 12,
      last_completed: 10,
      message: `Couldn't push configuration files to remote machine`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  }
}

export async function execute_commands({
  keypair,
  remote_machine_url,
  ...rest
}): Promise<STEP_RESPONSE> {
  let conn = new SSH_CONN(keypair, remote_machine_url, "ubuntu")
  try {
    await conn.run_command(
      "source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install-nvm.sh && ./install-nvm.sh ",
    )
    await conn.run_command(
      "source $HOME/.nvm/nvm.sh && cd ~ && chmod +x install.sh && ./install.sh ",
    )
    conn.disconnect()

    return {
      success: "OK",
      status: "COMPLETE",
      step_number: 12,
      next_step: null,
      last_completed: 12,
      message: "Executed configuration files on remote machine succesfully",
      error: null,
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  } catch (err) {
    conn.disconnect()
    return {
      success: "FAIL",
      status: "IN-PROGRESS",
      step_number: 12,
      next_step: null,
      last_completed: 11,
      message: `Couldn't exec commands to install things`,
      error: {
        err: err,
      },
      data: {
        keypair,
        remote_machine_url,
        ...rest,
      },
    }
  }
}
