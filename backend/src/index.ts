import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "./api/log-request";
import { AppDataSource } from "./data-source";
import { MulterSource } from "./multer-source";
import {
  getEndpointHandler,
  getEndpointsHandler,
  getHostsHandler,
} from "./api/get-endpoints";
import {
  deleteSpecHandler,
  getSpecHandler,
  getSpecListHandler,
  updateSpecHandler,
  uploadNewSpecHandler,
} from "./api/spec";
import { isRiskHandler } from "./api/data-class";
import {
  getAlertsHandler,
  getTopAlertsHandler,
  resolveAlertHandler,
} from "./api/alert";
import { getSummaryHandler } from "./api/summary";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.disable("x-powered-by");
app.use(bodyParser.json());

app.get("/api/v1", (req: Request, res: Response) => {
  res.send("OK");
});

app.post("/api/v1/log-request/single", logRequestSingleHandler);
app.post("/api/v1/log-request/batch", logRequestBatchHandler);
app.get("/api/v1/summary", getSummaryHandler);
app.get("/api/v1/endpoints/hosts", getHostsHandler);
app.get("/api/v1/endpoints", getEndpointsHandler);
app.get("/api/v1/endpoint/:endpointId", getEndpointHandler);

app.post("/api/v1/spec/new", MulterSource.single("file"), uploadNewSpecHandler);
app.delete("/api/v1/spec/:specFileName", deleteSpecHandler);
app.put(
  "/api/v1/spec/:specFileName",
  MulterSource.single("file"),
  updateSpecHandler
);
app.get("/api/v1/specs", getSpecListHandler);
app.get("/api/v1/spec/:specFileName", getSpecHandler);

app.put("/api/v1/data-class/isRisk/:dataClassId", isRiskHandler);

app.get("/api/v1/alerts", getAlertsHandler);
app.get("/api/v1/topAlerts", getTopAlertsHandler);
app.put("/api/v1/alert/resolve/:alertId", resolveAlertHandler);

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize();
    console.log(
      `Is AppDataSource Initialized? ${datasource.isInitialized ? "Yes" : "No"}`
    );
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
    //await EndpointsService.generateEndpointsFromTraces();
    //await EndpointsService.generateOpenApiSpec();
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`);
  }
};

main().catch((err) => {
  console.error(`Error in main try block: ${err}`);
});
