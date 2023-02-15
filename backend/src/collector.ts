import dotenv from "dotenv"
dotenv.config()

import mlog from "logger"
import express, { Express, Request, Response } from "express"
import { AppDataSource } from "data-source"
import { verifyApiKeyMiddleware } from "middleware/verify-api-key-middleware"
import { bodyParserMiddleware } from "middleware/body-parser-middleware"
import { MetloRequest } from "types"
import {
  registerLoggingRoutes,
  registerLoggingRoutesV2,
  registerVerificationRoutes,
} from "api/collector"

const app: Express = express()
const port = process.env.PORT || 8081
const router = express.Router()
const routerV2 = express.Router()

app.disable("x-powered-by")
app.use(async (req: MetloRequest, res, next) => {
  req.ctx = {}
  next()
})

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ limit: "2mb", extended: true }))
app.use(verifyApiKeyMiddleware)
app.use("/api/v1", router)
app.use("/api/v2", routerV2)
registerVerificationRoutes(router)
app.use(bodyParserMiddleware)

registerLoggingRoutes(router)
registerLoggingRoutesV2(routerV2)

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize()
    mlog.info(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
    app.listen(port, () => {
      mlog.info(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
  } catch (err) {
    mlog.withErr(err).error("CatchBlockInsideMain")
  }
}

main().catch(err => {
  mlog.withErr(err).error("Error in main try block")
})
