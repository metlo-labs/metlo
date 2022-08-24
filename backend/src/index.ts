import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { TypeormStore } from "connect-typeorm";
import session from "express-session";
import { Session as SessionModel } from "models";
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "api/log-request";
import {
  getEndpointHandler,
  getEndpointsHandler,
  getHostsHandler,
  getUsageHandler,
} from "api/get-endpoints";
import {
  deleteSpecHandler,
  getSpecHandler,
  getSpecListHandler,
  updateSpecHandler,
  uploadNewSpecHandler,
} from "api/spec";
import {
  getAlertsHandler,
  getTopAlertsHandler,
  resolveAlertHandler,
} from "api/alert";
import { updateDataFieldHandler } from "api/data-field";
import { getSummaryHandler } from "api/summary";
import { AppDataSource } from "data-source";
import { MulterSource } from "multer-source";
import {
  aws_instance_choices,
  aws_os_choices,
  setup_connection,
} from "./api/setup";
import { getTest, listTests, runTestHandler, saveTest } from "./api/tests";
import {
  get_connection_for_uuid,
  get_ssh_key_for_connection_uuid,
  list_connections,
  update_connection,
} from "./api/connections";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.disable("x-powered-by");
app.use(bodyParser.json());
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
  })
);

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK");
});

app.post("/api/v1/log-request/single", logRequestSingleHandler);
app.post("/api/v1/log-request/batch", logRequestBatchHandler);

app.get("/api/v1/summary", getSummaryHandler);
app.get("/api/v1/endpoints/hosts", getHostsHandler);
app.get("/api/v1/endpoints", getEndpointsHandler);
app.get("/api/v1/endpoint/:endpointId", getEndpointHandler);
app.get("/api/v1/endpoint/:endpointId/usage", getUsageHandler);

app.post("/api/v1/spec/new", MulterSource.single("file"), uploadNewSpecHandler);
app.delete("/api/v1/spec/:specFileName", deleteSpecHandler);
app.put(
  "/api/v1/spec/:specFileName",
  MulterSource.single("file"),
  updateSpecHandler
);
app.get("/api/v1/specs", getSpecListHandler);
app.get("/api/v1/spec/:specFileName", getSpecHandler);

app.put("/api/v1/data-field/:fieldId", updateDataFieldHandler);

app.get("/api/v1/alerts", getAlertsHandler);
app.get("/api/v1/topAlerts", getTopAlertsHandler);
app.put("/api/v1/alert/resolve/:alertId", resolveAlertHandler);

app.post("/api/v1/setup_connection", setup_connection);
app.post("/api/v1/setup_connection/aws/os", aws_os_choices);
app.post("/api/v1/setup_connection/aws/instances", aws_instance_choices);
app.get("/api/v1/list_connections", list_connections);
app.get("/api/v1/list_connections/:uuid", get_connection_for_uuid);
app.get(
  "/api/v1/list_connections/:uuid/sshkey",
  get_ssh_key_for_connection_uuid
);
app.post("/api/v1/update_connection", update_connection);
app.post("/api/v1/test/run", runTestHandler);

app.post("/api/v1/test/save", saveTest);
app.get("/api/v1/test/list", listTests);
app.get("/api/v1/test/list/:uuid", getTest);

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize();
    console.log(
      `Is AppDataSource Initialized? ${datasource.isInitialized ? "Yes" : "No"}`
    );
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`);
  }
};

main().catch((err) => {
  console.error(`Error in main try block: ${err}`);
});
