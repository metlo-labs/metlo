import dotenv from "dotenv"
dotenv.config()

import express, { Express, Request, Response } from "express"
import { AppDataSource } from "data-source"
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "collector_src/log-request"
import { verifyApiKeyMiddleware } from "middleware/verify-api-key-middleware"
import { bodyParserMiddleware } from "middleware/body-parser-middleware"
import { populateBlockFields } from "collector_src/block-fields"
import { populateAuthentication } from "collector_src/authentication"
import { MetloContext, MetloRequest } from "types"

const app: Express = express()
const port = process.env.PORT || 8081
app.disable("x-powered-by")

app.use(async (req: MetloRequest, res, next) => {
  req.ctx = {}
  next()
})
app.use(express.json({ limit: "250mb" }))
app.use(express.urlencoded({ limit: "250mb", extended: true }))

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.use(verifyApiKeyMiddleware)
app.use(bodyParserMiddleware)

app.post("/api/v1/log-request/single", logRequestSingleHandler)
app.post("/api/v1/log-request/batch", logRequestBatchHandler)

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
    const ctx: MetloContext = {}
    await Promise.all([populateBlockFields(), populateAuthentication(ctx)])
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`)
  }
}

main().catch(err => {
  console.error(`Error in main try block: ${err}`)
})
