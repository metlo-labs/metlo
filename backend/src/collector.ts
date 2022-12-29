import dotenv from "dotenv"
dotenv.config()

import express, { Express, Request, Response } from "express"
import fs from "fs"
import { AppDataSource } from "data-source"
import { verifyApiKeyMiddleware } from "middleware/verify-api-key-middleware"
import { bodyParserMiddleware } from "middleware/body-parser-middleware"
import { MetloContext, MetloRequest } from "types"
import { populateMetloConfig } from "services/metlo-config"
import { MetloConfig } from "models/metlo-config"
import { getRepoQB } from "services/database/utils"
import registerLoggingRoutes from "collector_src"

const app: Express = express()
const port = process.env.PORT || 8081
const router = express.Router()

app.disable("x-powered-by")
app.use(async (req: MetloRequest, res, next) => {
  req.ctx = {}
  next()
})

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.use(express.json({ limit: "250mb" }))
app.use(express.urlencoded({ limit: "250mb", extended: true }))
app.use(verifyApiKeyMiddleware)
app.use(bodyParserMiddleware)
app.use("/api/v1", router)

registerLoggingRoutes(router)

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize()
    console.log(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
    try {
      const ctx: MetloContext = {}
      const configString = fs.readFileSync("./metlo-config.yaml", "utf-8")
      const existingMetloConfig = await getRepoQB(ctx, MetloConfig)
        .select(["uuid"])
        .getRawOne()
      if (configString?.length > 0 && !existingMetloConfig) {
        await populateMetloConfig(ctx, configString)
      }
    } catch (err) {}
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
