import cluster from "cluster"
import os from "os"
import { AppDataSource } from "data-source"
import { analyzeTraces } from "services/jobs"

const totalCPUs = os.cpus().length

if (cluster.isPrimary) {
  console.log(`Number of CPUs is ${totalCPUs}`)
  console.log(`Master ${process.pid} is running`)

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork()
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    console.log("Let's fork another worker!")
    cluster.fork()
  })
} else {
  const main = async () => {
    const datasource = await AppDataSource.initialize()
    if (!datasource.isInitialized) {
      console.error("Couldn't initialize datasource...")
      return
    }
    console.log("AppDataSource Initialized...")
    console.log("Running Analyzer...")
    await analyzeTraces()
  }

  main()
}
