import chalk from "chalk"
import ora from "ora"
import { initUsers } from "./init"

const spinner = ora()

export const initJuiceShopUsers = async ({ host }) => {
  if (!host) {
    console.log(
      chalk.bold.red("Please provide host url for juice shop server."),
    )
    return
  }
  let url = null
  try {
    const urlObj = new URL(host)
    url = urlObj.href
  } catch (err) {
    console.log(chalk.bold.red(`Host is not a proper url: ${host}`))
    return
  }

  spinner.start(chalk.dim("Initializing Users..."))
  try {
    await initUsers(url)
  } catch (err) {
    spinner.fail(
      chalk.bold.red(`Encountered error while initializing users: ${err}`),
    )
    return
  }
  spinner.succeed(chalk.green("Initialized users."))
}
