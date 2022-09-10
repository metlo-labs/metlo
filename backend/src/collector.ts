import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import yaml from "js-yaml"
import fs from "fs"
import { AppDataSource } from "data-source"
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "collector_src/log-request"
import { verify_api_key } from "./collector_src/utils"
import { BlockFields } from "models"
import { getPathRegex } from "utils"
import { DisableRestMethod } from "@common/enums"
import { DatabaseService } from "services/database"
import { bodyParserMiddleware } from "middleware/body-parser-middleware"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 8081

app.disable("x-powered-by")
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.use(verify_api_key)
app.use(bodyParserMiddleware)

app.post("/api/v1/log-request/single", logRequestSingleHandler)
app.post("/api/v1/log-request/batch", logRequestBatchHandler)

const populateBlockFields = async () => {
  try {
    const blockFieldsDoc: object = yaml.load(
      fs.readFileSync("./block_fields.yaml", "utf-8"),
    ) as object
    const blockFieldsRepo = AppDataSource.getRepository(BlockFields)
    const removeEntries = await blockFieldsRepo.find()
    let entriesToAdd: BlockFields[] = []
    if (blockFieldsDoc) {
      for (const host in blockFieldsDoc) {
        const hostEntries: BlockFields[] = []
        const hostObj = blockFieldsDoc[host]
        let allDisablePaths = []
        if (hostObj) {
          if (hostObj["ALL"]) {
            allDisablePaths = hostObj["ALL"]["disable_paths"] ?? []
            const blockFieldEntry = BlockFields.create()
            blockFieldEntry.host = host
            blockFieldEntry.method = DisableRestMethod.ALL
            blockFieldEntry.path = "/"
            blockFieldEntry.pathRegex = "^/.*$"
            blockFieldEntry.disabledPaths = allDisablePaths
            hostEntries.push(blockFieldEntry)
          }
          for (const endpoint in hostObj) {
            if (endpoint && endpoint !== "ALL") {
              let endpointDisablePaths = allDisablePaths
              if (hostObj[endpoint]["ALL"]) {
                endpointDisablePaths = endpointDisablePaths?.concat(
                  hostObj[endpoint]["ALL"]["disable_paths"] ?? [],
                )
                const blockFieldEntry = BlockFields.create()
                blockFieldEntry.host = host
                blockFieldEntry.method = DisableRestMethod.ALL
                blockFieldEntry.pathRegex = getPathRegex(endpoint)
                blockFieldEntry.path = endpoint
                blockFieldEntry.disabledPaths = endpointDisablePaths
                hostEntries.push(blockFieldEntry)
              }
              for (const method in hostObj[endpoint]) {
                if (method && method !== "ALL") {
                  const blockFieldEntry = BlockFields.create()
                  blockFieldEntry.host = host
                  blockFieldEntry.method = DisableRestMethod[method]
                  blockFieldEntry.pathRegex = getPathRegex(endpoint)
                  blockFieldEntry.path = endpoint
                  blockFieldEntry.disabledPaths = endpointDisablePaths?.concat(
                    hostObj[endpoint][method]?.["disable_paths"] ?? [],
                  )
                  hostEntries.push(blockFieldEntry)
                }
              }
            }
          }
        }
        entriesToAdd = entriesToAdd.concat(hostEntries)
      }
    }
    await DatabaseService.executeTransactions(
      [entriesToAdd],
      [removeEntries],
      false,
    )
  } catch (err) {
    console.error(`Error loading block fields yaml: ${err}`)
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
    await populateBlockFields()
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
