import dotenv from "dotenv"
dotenv.config()

import express, { Express, Response } from "express"
import { TypeormStore } from "connect-typeorm"
import session from "express-session"
import { InstanceSettings, Session as SessionModel, User } from "models"
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
import { LoginType, MetloRequest } from "types"
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
import passport from "passport"
import ghStrategy from "passport-github2"
import JWT from "jsonwebtoken"
import { getRepository } from "services/database/utils"

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


app.use(passport.initialize());
app.use(passport.session());



if (process.env.GH_CLIENT_ID && process.env.GH_CLIENT_SECRET && process.env.GH_CALLBACK_URL) {
  passport.use(new ghStrategy({
    clientID: process.env.GH_CLIENT_ID,
    clientSecret: process.env.GH_CLIENT_SECRET,
    callbackURL: process.env.GH_CALLBACK_URL
  },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile)
      return done(null, profile);
    }
  ));
}

passport.serializeUser(async function SerializeGithub(user, done) {
  try {
    const jsonData = user._json
    const userInstance = new User()
    userInstance.id = `github-${jsonData.id}`
    userInstance.meta = user
    userInstance.name = user.username
    userInstance.account = LoginType.GITHUB
    if (user.photos && user.photos.length > 0) {
      userInstance.userImage = user.photos[0]
    }
    let repo = getRepository({}, User)
    await repo.save(userInstance)
    done(null, userInstance.id)
  } catch (err) {
    // done("pass")
    done(err)
  }
});

// passport.serializeUser(async function SerializeGoogle(user, done) {
//   console.log("Serializing Github")
// })

passport.deserializeUser(async function (id, done) {
  let repo = getRepository({}, User)
  const user = await repo.findOneBy({ id })
  done(null, user)
});



const apiRouter = express.Router()

apiRouter.use(function (req, res, next) {
  // @ts-ignore
  // req.user = new User()
  console.log("Authenticating")
  // @ts-ignore
  if (req.user)
    return next();
  else
    return res.status(401).json({
      error: 'User not authenticated'
    })

})

app.use("/api/v1", apiRouter);

app.get('/auth/error', (req, res) => res.send('Unknown Error'))
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/error' }),
  function (req, res) {
    //@ts-ignore
    res.send(JWT.sign(req.user, process.env.JWT_KEY, { expiresIn: '1800s' }));

  }
);

app.get("/login", (req, res) => {
  // @ts-ignore
  if (req.user) {
    // @ts-ignore
    res.status(200).send(req.user)
  } else {
    res.sendStatus(401)
  }
})

apiRouter.get("/", (req: MetloRequest, res: Response) => {
  res.send("OK")
})

apiRouter.get("/summary", getSummaryHandler)
apiRouter.get("/instance-settings", getInstanceSettingsHandler)
apiRouter.put("/instance-settings", putInstanceSettingsHandler)
apiRouter.get("/sensitive-data-summary", getSensitiveDataSummaryHandler)
apiRouter.get("/vulnerability-summary", getVulnerabilitySummaryHandler)
apiRouter.get("/endpoints/hosts", getHostsHandler)
apiRouter.get("/endpoints", getEndpointsHandler)
apiRouter.get("/endpoint/:endpointId", getEndpointHandler)
apiRouter.get("/endpoint/:endpointId/usage", getUsageHandler)
apiRouter.put(
  "/endpoint/:endpointId/authenticated",
  updateEndpointIsAuthenticated,
)

apiRouter.post("/spec/new", MulterSource.single("file"), uploadNewSpecHandler)
apiRouter.delete("/spec/:specFileName", deleteSpecHandler)
apiRouter.put(
  "/spec/:specFileName",
  MulterSource.single("file"),
  updateSpecHandler,
)
apiRouter.get("/specs", getSpecListHandler)
apiRouter.get("/spec/:specFileName", getSpecHandler)

apiRouter.post(
  "/data-field/:dataFieldId/update-classes",
  updateDataFieldClasses,
)
apiRouter.delete("/data-field/:dataFieldId", deleteDataFieldHandler)

apiRouter.get("/alerts", getAlertsHandler)
apiRouter.put("/alert/:alertId", updateAlertHandler)

apiRouter.post("/setup_connection", setupConnection)
apiRouter.get("/long_running/:uuid", getLongRunningState)
apiRouter.post("/setup_connection/aws/os", awsOsChoices)
apiRouter.post("/setup_connection/aws/instances", awsInstanceChoices)
apiRouter.post("/setup_connection/gcp/os", gcpOsChoices)
apiRouter.post("/setup_connection/gcp/instances", gcpInstanceChoices)
apiRouter.get("/list_connections", listConnections)
apiRouter.get("/list_connections/:uuid", getConnectionForUuid)
apiRouter.get("/list_connections/:uuid/sshkey", getSshKeyForConnectionUuid)
apiRouter.post("/update_connection", updateConnection)
apiRouter.delete("/delete_connection/:uuid", deleteConnection)

apiRouter.post("/test/run", runTestHandler)
apiRouter.post("/test/save", saveTest)
apiRouter.get("/test/list", listTests)
apiRouter.get("/test/list/:uuid", getTest)
apiRouter.delete("/test/:uuid/delete", deleteTest)

apiRouter.get("/keys/list", listKeys)
apiRouter.post("/keys/create", createKey)
apiRouter.delete("/keys/:name/delete", deleteKey)

apiRouter.put("/metlo-config", updateMetloConfigHandler)
apiRouter.get("/metlo-config", getMetloConfigHandler)

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
      `Is AppDataSource Initialized? ${datasource.isInitialized ? "Yes" : "No"
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
