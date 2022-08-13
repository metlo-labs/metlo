import { AppDataSource } from "data-source";
import { JobsService } from "services/jobs";

const main = async () => {
  const datasource = await AppDataSource.initialize();
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...");
    return;
  }
  console.log("AppDataSource Initialized...");
  console.log("Generating Endpoints...");
  JobsService.generateEndpointsFromTraces();
};

main();
