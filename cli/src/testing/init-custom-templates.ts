import fs from "fs"
import { promisify } from "util"
import child_process from "child_process"

import chalk from "chalk"
import commandExists from "command-exists"
import ora from "ora"

const exists = promisify(fs.exists)
const mkdir = promisify(fs.mkdir)
const exec = promisify(child_process.exec)

export const initCustomTemplates = async (path: string) => {
  const spinner = ora()
  spinner.start(chalk.dim("Initializing custom template project..."))
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.match(/v([\d]+)./)[1])
  if (majorVersion < 16) {
    spinner.fail(
      chalk.bold.red(
        "Node 16+ is required for Metlo. We recommend using nvm to install Node: https://github.com/nvm-sh/nvm",
      ),
    )
    return
  }
  const npmExists = await promisify(commandExists)("npm")
  if (!npmExists) {
    spinner.fail(chalk.bold.red("Error: npm not installed"))
    return
  }
  const pathExists = await exists(path)
  if (pathExists) {
    spinner.fail(chalk.bold.red(`Path: "${path}" already exists`))
    return
  }
  await mkdir(path)
  await mkdir(`${path}/templates`)
  await exec("npm init -y", { cwd: path })
  await exec("npm install @metlo/testing", { cwd: path })
  spinner.succeed(`Created custom template project at "${path}".`)
}
