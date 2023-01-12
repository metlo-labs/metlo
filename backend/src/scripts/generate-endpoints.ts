import mlog from "logger"
import { AppDataSource } from "data-source"
import { generateEndpointsFromTraces } from "services/jobs"
import { MetloContext } from "types"

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    mlog.error("Couldn't initialize datasource...")
    return
  }
  mlog.info("AppDataSource Initialized...")
  mlog.info("Generating Endpoints and OpenAPI Spec Files...")
  const ctx: MetloContext = {}
  await generateEndpointsFromTraces(ctx)
  mlog.info("Finished generating Endpoints and OpenAPI Spec Files.")
}

main()
