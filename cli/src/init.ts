import fs, { writeFileSync } from "fs"
import os from "os"
import path from "path"
import { CREDENTIAL_FILE } from "./utils"
import readline from "readline"
import { promisify } from "util"
import { prompt } from "enquirer"

const setup_host = async () => {
  // Function returns string, is marked as void for some reason.
  return (
    await prompt({
      type: "input",
      name: "host",
      message: "Host address of metlo backend :",
    })
  )["host"]
}

const init = async host => {
  const homeDir = os.homedir()
  const creditialFileExists = fs.existsSync(path.join(homeDir, CREDENTIAL_FILE))
  if (creditialFileExists) {
    console.log(
      `Credentials already exist at ~/${CREDENTIAL_FILE}. Are you sure you want to replace them? [Y/n]`,
    )
  } else {
    var backend_host: string
    console.log(host)
    // console.log(rest)
    if (host) {
      backend_host = host
    } else {
      backend_host = await setup_host()
    }
    writeFileSync(
      path.join(homeDir, CREDENTIAL_FILE),
      `METLO_HOST=${backend_host}`,
    )
  }
}

export default init
