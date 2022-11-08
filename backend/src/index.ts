import dotenv from "dotenv"
dotenv.config()

import express, { Express, Response } from "express"
import { TypeormStore } from "connect-typeorm"
import session from "express-session"
import { InstanceSettings, Session as SessionModel } from "models"
import {
  getEndpointHandler,
  getEndpointsHandler,
  getHostsHandler,
  getUsageHandler,
  updateEndpointIsAuthenticated,
} from "api/get-endpoints"
import {
  deleteSpecHandler,
  getSpecHandler,
  getSpecListHandler,
  updateSpecHandler,
  uploadNewSpecHandler,
} from "api/spec"
import { getAlertsHandler, updateAlertHandler } from "api/alert"
import { deleteDataFieldHandler, updateDataFieldClasses } from "api/data-field"
import { getSummaryHandler } from "api/summary"
import { MetloRequest } from "types"
import { AppDataSource } from "data-source"
import { MulterSource } from "multer-source"
import {
  awsInstanceChoices,
  awsOsChoices,
  gcpInstanceChoices,
  gcpOsChoices,
  getLongRunningState,
  setupConnection,
} from "./api/setup"
import {
  deleteTest,
  getTest,
  listTests,
  runTestHandler,
  saveTest,
} from "./api/tests"
import {
  deleteConnection,
  getConnectionForUuid,
  getSshKeyForConnectionUuid,
  listConnections,
  updateConnection,
} from "./api/connections"
import { RedisClient } from "utils/redis"
import { getSensitiveDataSummaryHandler } from "api/data-field/sensitive-data"
import { getVulnerabilitySummaryHandler } from "api/alert/vulnerability"
import { inSandboxMode } from "utils"
import { createKey, deleteKey, listKeys } from "api/keys"
import {
  getInstanceSettingsHandler,
  putInstanceSettingsHandler,
} from "api/settings"
import {
  getMetloConfigHandler,
  updateMetloConfigHandler,
} from "api/metlo-config"

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
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    store: new TypeormStore({
      cleanupLimit: 2,
      limitSubquery: false, // If using MariaDB.
      ttl: 86400,
    }).connect(AppDataSource.getRepository(SessionModel)),
    secret: process.env.EXPRESS_SECRET,
  }),
)
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
apiRouter.get("/api/v1/summary", getSummaryHandler)
apiRouter.get("/api/v1/instance-settings", getInstanceSettingsHandler)
apiRouter.put("/api/v1/instance-settings", putInstanceSettingsHandler)
apiRouter.get("/api/v1/sensitive-data-summary", getSensitiveDataSummaryHandler)
apiRouter.get("/api/v1/vulnerability-summary", getVulnerabilitySummaryHandler)
apiRouter.get("/api/v1/endpoints/hosts", getHostsHandler)
apiRouter.get("/api/v1/endpoints", getEndpointsHandler)
apiRouter.get("/api/v1/endpoint/:endpointId", getEndpointHandler)
apiRouter.get("/api/v1/endpoint/:endpointId/usage", getUsageHandler)
apiRouter.put(
  "/api/v1/endpoint/:endpointId/authenticated",
  updateEndpointIsAuthenticated,
)

apiRouter.post("/api/v1/spec/new", MulterSource.single("file"), uploadNewSpecHandler)
apiRouter.delete("/api/v1/spec/:specFileName", deleteSpecHandler)
apiRouter.put(
  "/api/v1/spec/:specFileName",
  MulterSource.single("file"),
  updateSpecHandler,
)
apiRouter.get("/api/v1/specs", getSpecListHandler)
apiRouter.get("/api/v1/spec/:specFileName", getSpecHandler)

apiRouter.post(
  "/api/v1/data-field/:dataFieldId/update-classes",
  updateDataFieldClasses,
)
apiRouter.delete("/api/v1/data-field/:dataFieldId", deleteDataFieldHandler)

apiRouter.get("/api/v1/alerts", getAlertsHandler)
apiRouter.put("/api/v1/alert/:alertId", updateAlertHandler)

apiRouter.post("/api/v1/setup_connection", setupConnection)
apiRouter.get("/api/v1/long_running/:uuid", getLongRunningState)
apiRouter.post("/api/v1/setup_connection/aws/os", awsOsChoices)
apiRouter.post("/api/v1/setup_connection/aws/instances", awsInstanceChoices)
apiRouter.post("/api/v1/setup_connection/gcp/os", gcpOsChoices)
apiRouter.post("/api/v1/setup_connection/gcp/instances", gcpInstanceChoices)
apiRouter.get("/api/v1/list_connections", listConnections)
apiRouter.get("/api/v1/list_connections/:uuid", getConnectionForUuid)
apiRouter.get("/api/v1/list_connections/:uuid/sshkey", getSshKeyForConnectionUuid)
apiRouter.post("/api/v1/update_connection", updateConnection)
apiRouter.delete("/api/v1/delete_connection/:uuid", deleteConnection)

apiRouter.post("/api/v1/test/run", runTestHandler)
apiRouter.post("/api/v1/test/save", saveTest)
apiRouter.get("/api/v1/test/list", listTests)
apiRouter.get("/api/v1/test/list/:uuid", getTest)
apiRouter.delete("/api/v1/test/:uuid/delete", deleteTest)

apiRouter.get("/api/v1/keys/list", listKeys)
apiRouter.post("/api/v1/keys/create", createKey)
apiRouter.delete("/api/v1/keys/:name/delete", deleteKey)

apiRouter.put("/api/v1/metlo-config", updateMetloConfigHandler)
apiRouter.get("/api/v1/metlo-config", getMetloConfigHandler)

app.use(apiRouter)

const initInstanceSettings = async () => {
  const settingRepository = AppDataSource.getRepository(InstanceSettings)
  const numSettings = await settingRepository.count()
  if (numSettings == 0) {
    console.log("Initializing Instance Settings")
    const setting = new InstanceSettings()
    await settingRepository.save(setting)
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
    await initInstanceSettings()
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
