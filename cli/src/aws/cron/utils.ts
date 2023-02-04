import dayjs from "dayjs"
import { execSync } from "node:child_process"
import { appendFileSync, writeFileSync } from "node:fs"

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
      "/Users/ninadsinha/Desktop/metlo_v2/cli/meta/out.txt",
      `${process.cwd()}/meta/log.txt`,
    )
    appendFileSync(
      `${process.cwd()}/meta/log.txt`,
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss ZZ")}] : ${text}\n`,
    )
  }
}
