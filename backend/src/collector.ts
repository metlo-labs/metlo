import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import yaml from "js-yaml"
import fs from "fs"
import { AppDataSource } from "data-source"
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "collector_src/log-request"
import { verifyApiKeyMiddleware } from "middleware/verify-api-key-middleware"
import { BlockFields, AuthenticationConfig } from "models"
import { getPathRegex } from "utils"
import { AuthType, DisableRestMethod } from "@common/enums"
import { DatabaseService } from "services/database"
import { bodyParserMiddleware } from "middleware/body-parser-middleware"
import {
  addToRedis,
  deleteKeyFromRedis,
  getFromRedis,
  getListFromRedis,
} from "suricata_setup/utils"
import { AUTH_CONFIG_LIST_KEY, BLOCK_FIELDS_ALL_REGEX } from "./constants"
import { BlockFieldsService } from "services/block-fields"
import { BlockFieldEntry } from "@common/types"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 8081

app.disable("x-powered-by")
app.use(express.json({ limit: "250mb" }))
app.use(express.urlencoded({ limit: "250mb", extended: true }))

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.use(verifyApiKeyMiddleware)
app.use(bodyParserMiddleware)

app.post("/api/v1/log-request/single", logRequestSingleHandler)
app.post("/api/v1/log-request/batch", logRequestBatchHandler)

const addToBlockFields = (
  blockFieldsEntries: Record<string, BlockFieldEntry[]>,
  host: string,
  method: DisableRestMethod,
  path: string,
  pathRegex: string,
  disabledPaths: string[],
) => {
  const entry = {
    method,
    path,
    pathRegex,
    disabledPaths,
    numberParams: BlockFieldsService.getNumberParams(pathRegex, method, path),
  }
  if (blockFieldsEntries[host]) {
    blockFieldsEntries[host].push(entry)
  } else {
    blockFieldsEntries[host] = [entry]
  }
}

const populateBlockFields = async () => {
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

const populateAuthentication = async () => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.error(`No ENCRYPTION_KEY found. Cannot set authentication config.`)
    return
  }
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const metloConfig: object = yaml.load(
      fs.readFileSync("./metlo-config.yaml", "utf-8"),
    ) as object
    const authConfigDoc = metloConfig?.["authentication"]
    const authConfigEntries: AuthenticationConfig[] = []
    const currAuthConfigEntries = await getListFromRedis(
      AUTH_CONFIG_LIST_KEY,
      0,
      -1,
    )
    if (authConfigDoc) {
      authConfigDoc.forEach(item => {
        const newConfig = new AuthenticationConfig()
        newConfig.host = item.host
        newConfig.authType = item.authType as AuthType
        if (item.headerKey) newConfig.headerKey = item.headerKey
        if (item.jwtUserPath) newConfig.jwtUserPath = item.jwtUserPath
        if (item.cookieName) newConfig.cookieName = item.cookieName
        authConfigEntries.push(newConfig)
      })
    }
    const deleteQb = queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(AuthenticationConfig)
    const addQb = queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(AuthenticationConfig)
      .values(authConfigEntries)
    await deleteQb.execute()
    await addQb.execute()
    await queryRunner.commitTransaction()
    if (currAuthConfigEntries) {
      await deleteKeyFromRedis([...currAuthConfigEntries, AUTH_CONFIG_LIST_KEY])
    }
  } catch (err) {
    console.error(`Error in populating metlo config authentication: ${err}`)
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner?.release()
  }
}

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize()
    console.log(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
    await Promise.all([populateBlockFields(), populateAuthentication()])
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
