import chalk from "chalk"
import os from "os"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { MetloConfig } from "./types"

export const CREDENTIAL_FOLDER = path.join(os.homedir(), ".metlo")
export const CREDENTIAL_FILE = path.join(CREDENTIAL_FOLDER, "credentials")

export const getConfig = (): MetloConfig => {
  let res = {
    metloHost: null,
    apiKey: null,
  }
  if (fs.existsSync(CREDENTIAL_FILE)) {
    const config = dotenv.parse(fs.readFileSync(CREDENTIAL_FILE, "utf8"))
    if (config.METLO_HOST) {
      res.metloHost = config.METLO_HOST
    }
    if (config.METLO_API_KEY) {
      res.apiKey = config.METLO_API_KEY
    }
  }
  if (process.env.METLO_HOST) {
    res.metloHost = process.env.METLO_HOST
  }
  if (process.env.METLO_API_KEY) {
    res.apiKey = process.env.METLO_API_KEY
  }
  if (!res.metloHost || !res.apiKey) {
    console.log(chalk.red.bold(`Run "metlo init" to setup metlo...`))
    throw new Error(`INVALID MELTO CONFIG: ${JSON.stringify(res, null, 4)}`)
  }
  return res as MetloConfig
}

export const mapOptionParser = (
  value: string,
  previous: Record<string, string>,
) => {
  if (value.length < 2 || value?.indexOf("=") === -1) {
    console.log(
      chalk.red.bold(
        `Invalid value for env argument: ${value}. Must be in format:`,
      ),
    )
    console.log(chalk.gray("--env ENV_VAR=value --env ENV_VAR_2=value2"))
    process.exit(1)
  }
  const idx = value.indexOf("=")
  const key = value.slice(0, idx)
  const val = value.slice(idx + 1, value.length)
  return { ...previous, [key]: val }
}
