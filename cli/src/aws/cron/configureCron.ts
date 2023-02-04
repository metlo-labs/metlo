import { execSync } from "node:child_process"
import {
  existsSync,
  appendFileSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs"
import { stringToCSV } from "./utils"

const cron_script_path = `${process.cwd()}/meta/cron_script.sh`
const data_file_path = `${process.cwd()}/meta/mirrors.csv`
const CRON_DEFINITION = `*/5 * * * * ${cron_script_path}`

function checkIfCRONconfigured() {
  const res = execSync("crontab -l")
  const scripts = res
    .toString()
    .split("\n")
    .map(line =>
      line
        .split(" ")
        .filter(part => part.trim() !== "")
        .map(part => part.trim()),
    )
    .filter(segments => segments.length > 0)

  const script_paths = scripts.map(part => part.slice(5).join(" "))

  return script_paths.includes(cron_script_path)
}

export function updateRegisteredTargets(id, target, source, region) {
  if (existsSync(data_file_path)) {
    const mirrors = stringToCSV(readFileSync(data_file_path).toString())
    if (!mirrors.find(mirror => mirror.uuid === id)) {
      // ID doesn't exist
      appendFileSync(data_file_path, `\n${id},${target},${source},${region}`)
    }
  } else {
    writeFileSync(
      data_file_path,
      `id,target,source,region\n${id},${target},${source},${region}`,
    )
  }
}

export function registerCRON() {
  if (!existsSync(`${process.cwd()}/meta`)) {
    mkdirSync(`${process.cwd()}/meta`)
  }
  if (!checkIfCRONconfigured()) {
    writeFileSync(`${process.cwd()}/meta/metlo-cron.txt`, CRON_DEFINITION)
    execSync(`crontab ${process.cwd()}/meta/metlo-cron.txt`)
  }
  if (!existsSync(cron_script_path)) {
    const metlo_location = execSync("command -v metlo").toString()
    writeFileSync(
      `${process.cwd()}/meta/cron_script.sh`,
      `${metlo_location} traffic-mirror aws from-file ${process.cwd()}/meta/mirrors.csv`,
    )
  }
}

// checkIfCRONconfigured()
// updateRegisteredTargets()
