import dotenv from "dotenv"
dotenv.config()

import mlog from "logger"
import express, { Express, Response } from "express"
import { InstanceSettings } from "models"
import { MetloRequest } from "types"
import { AppDataSource } from "data-source"
import { RedisClient } from "utils/redis"
import { inSandboxMode } from "utils"
import registerKeyRoutes from "api/keys"
import registerInstanceSettingsRoutes from "api/settings"
import registerAlertRoutes from "api/alert"
import registerSummaryRoutes from "api/summary"
import registerMetloConfigRoutes from "api/metlo-config"
import registerWebhookRoutes from "api/webhook"
import registerTestingRoutes from "api/testing"
import registerSpecRoutes from "api/spec"
import registerEndpointRoutes from "api/endpoints"
import registerTracesRoutes from "api/traces"

const port = process.env.PORT || 8080
RedisClient.getInstance()

const app: Express = express()
app.disable("x-powered-by")

app.use(async (req: MetloRequest, res, next) => {
  req.ctx = {}
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(async (req, res, next) => {
  if (inSandboxMode && req.method != "GET") {
    res.status(401).send("Not enabled in sandbox mode...")
    return
  } else {
    next()
  }
})

app.get("/api/v1", (req: MetloRequest, res: Response) => {
  res.send("OK")
})

const apiRouter = express.Router()

registerSummaryRoutes(apiRouter)
registerInstanceSettingsRoutes(apiRouter)
registerEndpointRoutes(apiRouter)
registerSpecRoutes(apiRouter)
registerAlertRoutes(apiRouter)
registerTestingRoutes(apiRouter)
registerKeyRoutes(apiRouter)
registerMetloConfigRoutes(apiRouter)
registerWebhookRoutes(apiRouter)
registerTracesRoutes(apiRouter)

app.use(apiRouter)

const initInstanceSettings = async () => {
  const settingRepository = AppDataSource.getRepository(InstanceSettings)
  const numSettings = await settingRepository.count()
  if (numSettings == 0) {
    mlog.info("Initializing Instance Settings")
    const setting = new InstanceSettings()
    await settingRepository.save(setting)
  }
}

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize()
    mlog.info(
      `Is AppDataSource Initialized? ${
        datasource.isInitialized ? "Yes" : "No"
      }`,
    )
    await initInstanceSettings()
    app.listen(port, () => {
      mlog.info(`⚡️[server]: Server is running at http://localhost:${port}`)
    })
    throw Error("asdf")
  } catch (err) {
    mlog.withErr(err).error(`CatchBlockInsideMain`)
  }
}

main().catch(err => {
  mlog.withErr(err).error(`Error in main try block`)
})
