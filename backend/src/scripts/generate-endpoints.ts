import { AppDataSource } from "data-source"
import { generateEndpointsFromTraces } from "services/jobs"
import { MetloContext } from "types"

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")
  console.log("Generating Endpoints and OpenAPI Spec Files...")
  const ctx: MetloContext = {}
  await generateEndpointsFromTraces(ctx)
  console.log("Finished generating Endpoints and OpenAPI Spec Files.")
}

main()
