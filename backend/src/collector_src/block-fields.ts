import yaml from "js-yaml"
import fs from "fs"
import { getPathRegex } from "utils"
import { DisableRestMethod } from "@common/enums"
import { BlockFieldsService } from "services/block-fields"
import { BlockFieldEntry } from "@common/types"
import { BLOCK_FIELDS_ALL_REGEX } from "~/constants"

const addToBlockFields = (
  blockFieldsEntries: Record<string, BlockFieldEntry[]>,
  host: string,
  method: DisableRestMethod,
  path: string,
  pathRegex: string,
  disabledPaths: string[],
) => {
  const disabledPathsObj = {
    reqQuery: [],
    reqHeaders: [],
    reqBody: [],
    resHeaders: [],
    resBody: [],
  }
  disabledPaths.forEach(path => {
    if (path.includes("req.query")) disabledPathsObj.reqQuery.push(path)
    else if (path.includes("req.headers"))
      disabledPathsObj.reqHeaders.push(path)
    else if (path.includes("req.body")) disabledPathsObj.reqBody.push(path)
    else if (path.includes("res.headers"))
      disabledPathsObj.resHeaders.push(path)
    else if (path.includes("res.body")) disabledPathsObj.resBody.push(path)
  })
  const entry = {
    method,
    path,
    pathRegex,
    disabledPaths: disabledPathsObj,
    numberParams: BlockFieldsService.getNumberParams(pathRegex, method, path),
  }
  if (blockFieldsEntries[host]) {
    blockFieldsEntries[host].push(entry)
  } else {
    blockFieldsEntries[host] = [entry]
  }
}

export const populateBlockFields = async () => {
  try {
    const metloConfig: object = yaml.load(
      fs.readFileSync("./metlo-config.yaml", "utf-8"),
    ) as object
    const blockFieldsDoc = metloConfig?.["blockFields"]
    const blockFieldsEntries: Record<string, BlockFieldEntry[]> = {}
    if (blockFieldsDoc) {
      for (const host in blockFieldsDoc) {
        const hostObj = blockFieldsDoc[host]
        let allDisablePaths = []
        if (hostObj) {
          if (hostObj["ALL"]) {
            allDisablePaths = hostObj["ALL"]["disable_paths"] ?? []
            const pathRegex = BLOCK_FIELDS_ALL_REGEX
            const path = "/"
            addToBlockFields(
              blockFieldsEntries,
              host,
              DisableRestMethod.ALL,
              path,
              pathRegex,
              allDisablePaths,
            )
          }
          for (const endpoint in hostObj) {
            if (endpoint && endpoint !== "ALL") {
              let endpointDisablePaths = allDisablePaths
              if (hostObj[endpoint]["ALL"]) {
                endpointDisablePaths = endpointDisablePaths?.concat(
                  hostObj[endpoint]["ALL"]["disable_paths"] ?? [],
                )
                const pathRegex = getPathRegex(endpoint)
                addToBlockFields(
                  blockFieldsEntries,
                  host,
                  DisableRestMethod.ALL,
                  endpoint,
                  pathRegex,
                  endpointDisablePaths,
                )
              }
              for (const method in hostObj[endpoint]) {
                if (method && method !== "ALL") {
                  const blockFieldMethod = DisableRestMethod[method]
                  const pathRegex = getPathRegex(endpoint)
                  const disabledPaths = endpointDisablePaths?.concat(
                    hostObj[endpoint][method]?.["disable_paths"] ?? [],
                  )
                  addToBlockFields(
                    blockFieldsEntries,
                    host,
                    blockFieldMethod,
                    endpoint,
                    pathRegex,
                    disabledPaths,
                  )
                }
              }
            }
          }
        }
      }
    }
    BlockFieldsService.entries = blockFieldsEntries
  } catch (err) {
    console.error(`Error in populating metlo config blockFields: ${err}`)
  }
}
