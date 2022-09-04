import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import { AppDataSource } from "data-source"
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "collector_src/log-request"
import { CollectorDataSource } from "./collector-data-source"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 8080

app.disable("x-powered-by")
app.use(bodyParser.json())

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.post("/api/v1/log-request/single", logRequestSingleHandler)
app.post("/api/v1/log-request/batch", logRequestBatchHandler)

const main = async () => {
  try {
    const datasource = await CollectorDataSource.initialize()
    console.log(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
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
