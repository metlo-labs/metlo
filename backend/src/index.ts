import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {
  logRequestBatchHandler,
  logRequestSingleHandler,
} from "./api/log-request";
import { AppDataSource } from "./data-source";
import { MulterSource } from "./multer-source";
import { getEndpointHandler, getEndpointsHandler } from "./api/get-endpoints";
import {
  deleteSpecHandler,
  updateSpecHandler,
  uploadNewSpecHandler,
} from "./api/spec";
import { EndpointsService } from "./services/endpoints";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("OK");
});

app.post("/log-request/single", logRequestSingleHandler);
app.post("/log-request/batch", logRequestBatchHandler);
app.get("/endpoints", getEndpointsHandler);
app.get("/endpoint/:endpointId", getEndpointHandler);
app.post("/spec/new", MulterSource.single("file"), uploadNewSpecHandler);
app.delete("/spec/delete/:specFileName", deleteSpecHandler);
app.post("/spec/update", MulterSource.single("file"), updateSpecHandler);

const main = async () => {
  try {
    const datasource = await AppDataSource.initialize();
    console.log(
      `Is AppDataSource Initialized? ${datasource.isInitialized ? "Yes" : "No"}`
    );
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
    await EndpointsService.generateEndpointsFromTraces();
  } catch (err) {
    console.error(`CatchBlockInsideMain: ${err}`);
  }
};

main().catch((err) => {
  console.error(`Error in main try block: ${err}`);
});
