import os from "node:os"
import { ConfigOptions } from "types"
import SetupMiddleware from "./middleware"
import WorkerPool from "./pool"

const pool = new WorkerPool(os.cpus().length, "./workerTarget.js")
const endpoint = "api/v1/log-request/single"

function exit() {
  pool.close()
}

process.on("exit", exit)
process.on("SIGTERM", exit)

const init = (key: string, host: string, opts?: ConfigOptions) => {
  try {
    new URL(host)
  } catch (err) {
    console.error(err)
    throw new Error(`Couldn't load metlo. Host is not a proper url : ${host}`)
  }
  let metlo_host = host
  if (metlo_host[metlo_host.length - 1] != "/") {
    metlo_host += "/"
  }
  metlo_host += endpoint
  SetupMiddleware({ host: metlo_host, key, pool, opts })
}

export default init
