import dayjs from "dayjs"
import { execSync } from "node:child_process"
import { appendFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

let journalExists

export function stringToCSV(text: string) {
  return text
    .split("\n")
    .map<{ uuid: string; target: string; source: string; region: string }>(
      part => {
        const split = part.split(",")
        return {
          uuid: split[0],
          target: split[1],
          source: split[2],
          region: split[3],
        }
      },
    )
    .splice(1)
}

export function logger(text: string) {
  if (journalExists === undefined) {
    try {
      journalExists = execSync("command -v systemd-cat").toString() != ""
    } catch (err) {}
  }
  if (journalExists) {
    execSync(`echo ${text} | systemd-cat -p info -t metlo`, {
      timeout: 100, //ms
    })
  } else {
    appendFileSync(
      `${getBaseLocation()}/log.txt`,
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss ZZ")}] : ${text}\n`,
    )
  }
}

export function getBaseLocation() {
  if (process.platform === "darwin") {
    const base = path.resolve(
      String.raw`${process.env.HOME}/Library/Application Support`,
    )
    if (!existsSync(`${base}/metlo`)) {
      mkdirSync(`${base}/metlo`, { mode: 0o755 })
    }
    return `${base}/metlo`
  } else if (process.platform === "linux") {
    const base = path.resolve(String.raw`${process.env.HOME}`)
    if (!existsSync(`${base}/.metlo`)) {
      mkdirSync(`${base}/.metlo`, { mode: 0o755 })
    }
    return `${base}/.metlo`
  } else {
    throw new Error(`Unsupported platform ${process.platform} for CRON setup`)
  }
}
