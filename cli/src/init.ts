import fs, { writeFileSync } from "fs"
import { CREDENTIAL_FILE, CREDENTIAL_FOLDER } from "./utils"
import { prompt } from "enquirer"
import { isUri } from "valid-url"

const get_host_from_cli = async () => {
  const resp = await prompt([
    {
      type: "input",
      name: "host",
      message: "Host address of metlo backend:",
    },
  ])
  return resp["host"] as string
}

const get_key_from_cli = async () => {
  const resp = await prompt([
    {
      type: "password",
      name: "key",
      message: "Enter your Metlo API Key:",
    },
  ])
  return resp["key"] as string
}

const should_replace_credentials = async () => {
  return (
    await prompt({
      type: "confirm",
      name: "replace",
      message: `Credentials already exist at ${CREDENTIAL_FILE}. Are you sure you want to replace them?`,
    })
  )["replace"] as boolean
}

const setup_new_cred = async (host?: string, key?: string) => {
  var backend_host: string
  var api_key: string
  if (host) {
    backend_host = host
  } else {
    backend_host = await get_host_from_cli()
  }
  if (key) {
    api_key = key
  } else {
    api_key = await get_key_from_cli()
  }

  if (isUri(backend_host)) {
    if (!fs.existsSync(CREDENTIAL_FOLDER)) {
      fs.mkdirSync(CREDENTIAL_FOLDER)
    }
    writeFileSync(
      CREDENTIAL_FILE,
      `METLO_HOST=${backend_host}\nMETLO_API_KEY=${api_key}`,
    )
  } else {
    console.log(`Invalid url passed for backend host : ${backend_host}`)
  }
}

interface InitParams {
  backend_url: string
  api_key: string
}

const init = async ({ backend_url, api_key }: InitParams) => {
  const creditialFileExists = fs.existsSync(CREDENTIAL_FILE)
  if (creditialFileExists) {
    let shouldReplace = await should_replace_credentials()
    if (shouldReplace) {
      setup_new_cred(backend_url, api_key)
    } else {
      console.log("Leaving credentials file untouched...")
    }
  } else {
    setup_new_cred(backend_url, api_key)
  }
}

export default init
