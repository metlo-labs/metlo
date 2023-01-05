import fs from "fs"
import axios from "axios"
import chalk from "chalk"
import ora from "ora"
import { validateTemplateFileContents } from "./validate"
import { getConfig } from "../utils"
import { urlJoin } from "./utils"

const spinner = ora()

interface PushTemplateResp {
  name: string
  version: number
  success: boolean
  exists: boolean
}

export const pushTemplates = async (paths: string[]) => {
  spinner.start(chalk.dim("Pushing templates..."))
  let request: { template: string; type: string }[] = []
  for (const path of paths) {
    let type = ""
    if (path.endsWith(".ts")) {
      type = "TS"
    }
    if (path.endsWith(".js")) {
      type = "JS"
    }
    if (!type || !fs.existsSync(path)) {
      spinner.fail(chalk.bold.red(`INVALID PATH: "${path}"`))
      return
    }
    const contents = fs.readFileSync(path, {
      encoding: "utf8",
      flag: "r",
    })
    const err = validateTemplateFileContents(path, contents)
    if (err) {
      spinner.fail(chalk.red(err))
      return
    }
    request.push({
      template: contents,
      type: type,
    })
  }
  const config = getConfig()
  let url = urlJoin(config.metloHost, "api/v1/template")
  try {
    const { data: resp } = await axios.post<PushTemplateResp[]>(
      url,
      { templates: request },
      {
        headers: { Authorization: config.apiKey },
      },
    )
    spinner.succeed(chalk.green("Done pushing templates."))
    console.log(resp)
  } catch (err) {
    spinner.fail(chalk.bold.red("Failed pushing templates"))
    console.log(chalk.bold.red(err.message))
    if (err?.response?.data) {
      console.log(chalk.red(JSON.stringify(err?.response?.data, null, 4)))
    }
  }
}
