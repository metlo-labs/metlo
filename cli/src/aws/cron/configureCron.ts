import { execSync } from "node:child_process"
import {
  existsSync,
  appendFileSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs"
import { getBaseLocation, stringToCSV } from "./utils"

const cron_script_path = `${getBaseLocation()}/cron_script.sh`
const data_file_path = `${getBaseLocation()}/mirrors.csv`
const CRON_DEFINITION = `*/5 * * * * ${cron_script_path.replace(/ /g, "\\ ")}`

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

export function addRegisteredTargets(id, target, source, region) {
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
      { flag: "wx" },
    )
  }
}

export function removeRegisteredTargets(id) {
  if (existsSync(data_file_path)) {
    const lines = stringToCSV(readFileSync(data_file_path).toString())
      .filter(mirror => mirror.uuid !== id)
      .map(
        ({ uuid, target, source, region }) =>
          `${uuid},${target},${source},${region}`,
      )
    writeFileSync(
      data_file_path,
      `id,target,source,region\n` + lines.join("\n"),
      { flag: "wx" },
    )
  }
}

export function registerCRON() {
  if (!existsSync(`${getBaseLocation()}`)) {
    mkdirSync(`${getBaseLocation()}`, { mode: 0o755 })
  }
  if (!checkIfCRONconfigured()) {
    const location = String.raw`${getBaseLocation()}/metlo-cron.txt`
    writeFileSync(location, CRON_DEFINITION, { mode: 0o755, flag: "wx" })
    execSync(`crontab ${location.replace(/ /g, "\\ ")}`)
  }
  if (!existsSync(cron_script_path)) {
    // TODO: Confirm if metlo replacement based on NODE_ENV works
    const metlo_location =
      process.env.NODE_ENV === "development"
        ? execSync("command -v node").toString().trim() +
          ` ${process.cwd()}/dist/index.js`
        : execSync("command -v metlo").toString().trim()
    writeFileSync(
      `${getBaseLocation()}/cron_script.sh`,
      `${metlo_location} traffic-mirror aws from-file ${getBaseLocation()}/mirrors.csv`,
      { mode: 0o755, flag: "wx" },
    )
  }
}

// checkIfCRONconfigured()
// updateRegisteredTargets()
