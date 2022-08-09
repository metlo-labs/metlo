import schedule from "node-schedule";
import { AppDataSource } from "data-source";
import { JobsService } from "services/jobs";

const main = async () => {
  const datasource = await AppDataSource.initialize();
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...");
    return;
  }
  console.log("AppDataSource Initialized...");

  schedule.scheduleJob("0 * * * *", () => {
    console.log("Generating Endpoints...");
    JobsService.generateEndpointsFromTraces();
  });

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(() => process.exit(0));
  });
};

main();
