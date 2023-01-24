import fs from "fs"
import { execSync } from "child_process"

import chalk from "chalk"
import commandExists from "command-exists"

export const initCustomTemplates = (path: string) => {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.match(/v([\d]+)./)[1])
  if (majorVersion < 16) {
    console.log(
      chalk.bold.red(
        "Node 16+ is required for Metlo. We recommend using nvm to install Node: https://github.com/nvm-sh/nvm",
      ),
    )
    return
  }
  if (!commandExists.sync("npm")) {
    console.log(chalk.bold.red("Error: npm not installed"))
    return
  }
  fs.mkdirSync(path)
  fs.mkdirSync(`${path}/templates`)
  execSync("npm init -y", { cwd: path })
  execSync("npm install @metlo/testing", { cwd: path })
}
