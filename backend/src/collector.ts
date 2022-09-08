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
        const hostEntry = blockFieldsDoc[host]
        let allDisablePaths = []
        if (hostEntry) {
          if (hostEntry["ALL"]) {
            allDisablePaths = hostEntry["ALL"]["disable_paths"]
          }
          for (const endpoint in hostEntry) {
            if (endpoint && endpoint !== "ALL") {
              for (const method in hostEntry[endpoint]) {
                const blockFieldEntry = BlockFields.create()
                blockFieldEntry.host = host
                blockFieldEntry.method = DisableRestMethod[method]
                blockFieldEntry.pathRegex = getPathRegex(endpoint)
                blockFieldEntry.path = endpoint
                blockFieldEntry.disabledPaths =
                  hostEntry[endpoint][method]?.["disable_paths"]?.concat(
                    allDisablePaths,
                  )
                hostEntries.push(blockFieldEntry)
              }
            }
          }
        }
        if (hostEntries?.length === 0 && allDisablePaths.length > 0) {
          const blockFieldEntry = BlockFields.create()
          blockFieldEntry.host = host
          blockFieldEntry.method = DisableRestMethod.ALL
          blockFieldEntry.path = "/"
          blockFieldEntry.pathRegex = "^\/[0-9a-zA-Z\/]*$"
          blockFieldEntry.disabledPaths = allDisablePaths
          hostEntries.push(blockFieldEntry)
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
