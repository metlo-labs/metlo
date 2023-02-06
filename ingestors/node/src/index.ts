import os from "node:os"
import { ConfigOptions } from "types"
import { ping_home } from "./utils/ping_home"
import SetupMiddleware from "./middleware"
import WorkerPool from "./pool"
import { Logger } from "./utils/Logger"

const pool = new WorkerPool(os.cpus().length, "./workerTarget.js")
const endpoint = "api/v1/log-request/single"

function exit() {
  pool.close()
}

process.on("exit", exit)
process.on("SIGTERM", exit)

const init = (key: string, host: string, opts?: ConfigOptions) => {
  const logger = Logger.getLogger(opts?.logLevel)
  try {
    new URL(host)
  } catch (err) {
    logger.trace(err)
    throw new Error(`Couldn't load metlo. Host is not a proper url : ${host}`)
  }
  if (opts?.apiHost) {
    try {
      const apiHost = new URL(opts.apiHost)
      opts = { ...opts, apiHost: apiHost.host }
    } catch (err) {
      logger.trace(err)
      throw new Error(
        `Couldn't load metlo. API Host provided in opts is not a proper url: ${opts.apiHost}`,
      )
    }
  }
  let metlo_host = host
  if (metlo_host[metlo_host.length - 1] != "/") {
    metlo_host += "/"
  }

  // TODO : Maybe add an abort controller so that we can
  // undo the setup done in the middleware if init goes wrong.
  ping_home(metlo_host, key).catch(() => {})
  metlo_host += endpoint
  SetupMiddleware({ host: metlo_host, key, pool, opts })
}

export default init
