import express, { Express, Request, Response } from "express"
import dotenv from "dotenv"
import { TypeormStore } from "connect-typeorm"
import session from "express-session"
import { InstanceSettings, Session as SessionModel } from "models"
import {
  getEndpointHandler,
  getEndpointsHandler,
  getHostsHandler,
  getUsageHandler,
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
import { getAttacksHandler } from "api/attacks"

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 8080
RedisClient.getInstance()

app.disable("x-powered-by")
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

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK")
})

app.get("/api/v1/summary", getSummaryHandler)
app.get("/api/v1/sensitive-data-summary", getSensitiveDataSummaryHandler)
app.get("/api/v1/vulnerability-summary", getVulnerabilitySummaryHandler)
app.get("/api/v1/endpoints/hosts", getHostsHandler)
app.get("/api/v1/endpoints", getEndpointsHandler)
app.get("/api/v1/endpoint/:endpointId", getEndpointHandler)
app.get("/api/v1/endpoint/:endpointId/usage", getUsageHandler)

app.post("/api/v1/spec/new", MulterSource.single("file"), uploadNewSpecHandler)
app.delete("/api/v1/spec/:specFileName", deleteSpecHandler)
app.put(
  "/api/v1/spec/:specFileName",
  MulterSource.single("file"),
  updateSpecHandler,
)
app.get("/api/v1/specs", getSpecListHandler)
app.get("/api/v1/spec/:specFileName", getSpecHandler)

app.post(
  "/api/v1/data-field/:dataFieldId/update-classes",
  updateDataFieldClasses,
)
app.delete("/api/v1/data-field/:dataFieldId", deleteDataFieldHandler)

app.get("/api/v1/alerts", getAlertsHandler)
app.put("/api/v1/alert/:alertId", updateAlertHandler)

app.post("/api/v1/setup_connection", setupConnection)
app.get("/api/v1/long_running/:uuid", getLongRunningState)
app.post("/api/v1/setup_connection/aws/os", awsOsChoices)
app.post("/api/v1/setup_connection/aws/instances", awsInstanceChoices)
app.post("/api/v1/setup_connection/gcp/os", gcpOsChoices)
app.post("/api/v1/setup_connection/gcp/instances", gcpInstanceChoices)
app.get("/api/v1/list_connections", listConnections)
app.get("/api/v1/list_connections/:uuid", getConnectionForUuid)
app.get("/api/v1/list_connections/:uuid/sshkey", getSshKeyForConnectionUuid)
app.post("/api/v1/update_connection", updateConnection)
app.delete("/api/v1/delete_connection/:uuid", deleteConnection)

app.post("/api/v1/test/run", runTestHandler)
app.post("/api/v1/test/save", saveTest)
app.get("/api/v1/test/list", listTests)
app.get("/api/v1/test/list/:uuid", getTest)
app.delete("/api/v1/test/:uuid/delete", deleteTest)

app.get("/api/v1/attacks", getAttacksHandler)

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
