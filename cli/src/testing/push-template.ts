import fs from "fs"
import path from "path"
import axios from "axios"
import chalk from "chalk"
import glob from "glob"
import ora from "ora"
import { prompt } from "enquirer"
import { validateTemplateFileContents } from "./validate"
import { getConfig } from "../utils"
import { urlJoin } from "./utils"

const spinner = ora()

export interface PushTemplateResp {
  name: string
  version: number
  success: boolean
  exists: boolean
}

export interface PushTemplateReq {
  template: string
  type: string
}

const getRecursiveFiles = (paths: string[]): string[] => {
  let output: string[] = []
  for (const p of paths) {
    if (fs.lstatSync(p).isDirectory()) {
      output = output.concat(glob.sync(path.join(p, "**/*")))
    } else {
      output.push(p)
    }
  }
  return output
}

const findTemplatesInPaths = async (
  paths: string[],
): Promise<PushTemplateReq[] | null> => {
  let output: PushTemplateReq[] = []
  if (paths.length > 250) {
    const { _continue }: { _continue: boolean } = await prompt([
      {
        type: "confirm",
        name: "_continue",
        message: `Selected ${paths.length} files, are you sure this is the correct template path?`,
      },
    ])
    if (!_continue) {
      console.log(chalk.bold.red("Exiting..."))
      return null
    }
  }
  for (const p of paths) {
    let type = ""
    if (p.endsWith(".ts")) {
      type = "TS"
    }
    if (p.endsWith(".js")) {
      type = "JS"
    }
    if (!type) {
      continue
    }
    try {
      const contents = fs.readFileSync(p, {
        encoding: "utf8",
        flag: "r",
      })
      const err = validateTemplateFileContents(p, contents)
      if (err) {
        console.log(`Unable to load file "${p}": ${err}`)
        continue
      }
      output.push({
        template: contents,
        type: type,
      })
    } catch (err) {
      console.log(`Unable to load file "${p}": ${err.message}`)
    }
  }
  return output
}

export const pushTemplates = async (paths: string[]) => {
  const resolvedPaths = getRecursiveFiles(paths)
  const templateRequests = await findTemplatesInPaths(resolvedPaths)
  if (templateRequests == null) {
    return
  }
  if (templateRequests.length == 0) {
    console.log(
      chalk.bold.red(
        `Couldn't find any templates in paths ${paths
          .map(e => `"${e}"`)
          .join(", ")}.`,
      ),
    )
    return
  }
  spinner.start(chalk.dim(`Pushing ${templateRequests.length} templates...`))
  const config = getConfig()
  let url = urlJoin(config.metloHost, "api/v1/template")
  try {
    const { data: resp } = await axios.post<PushTemplateResp[]>(
      url,
      { templates: templateRequests },
      {
        headers: { Authorization: config.apiKey },
      },
    )
    spinner.succeed(chalk.green("Done pushing templates."))
    const savedTemplates = resp.filter(e => !e.exists)
    const skippedTemplates = resp.filter(e => e.exists)
    if (savedTemplates.length > 0) {
      console.log(chalk.bold.green(`Saved ${savedTemplates.length} Templates.`))
      savedTemplates.forEach(e => {
        console.log(chalk.bold.green(`  • ${e.name} - Version ${e.version}`))
      })
    }
    if (skippedTemplates.length > 0) {
      console.log(
        chalk.bold.dim(
          `Skipped ${skippedTemplates.length} Already Existing Templates.`,
        ),
      )
      skippedTemplates.forEach(e => {
        console.log(chalk.bold.dim(`  • ${e.name} - Version ${e.version}`))
      })
    }
  } catch (err) {
    spinner.fail(chalk.bold.red("Failed pushing templates"))
    console.log(chalk.bold.red(err.message))
    if (err?.response?.data) {
      console.log(chalk.red(JSON.stringify(err?.response?.data, null, 4)))
    }
  }
}
