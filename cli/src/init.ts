import fs from "fs"
import os from "os"
import path from "path"
import { CREDENTIAL_FILE } from "./utils"

const init = () => {
  const homeDir = os.homedir()
  const creditialFileExists = fs.existsSync(path.join(homeDir, CREDENTIAL_FILE))
  if (creditialFileExists) {
    console.log(
      `Credentials already exist at ~/${CREDENTIAL_FILE}. Are you sure you want to replace them? [Y/n]`,
    )
  }
}

export default init
