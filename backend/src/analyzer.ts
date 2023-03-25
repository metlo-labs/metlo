import { QueuedApiTrace } from "@common/types"
import mlog from "logger"
import path from "path"
import Piscina from "piscina"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "./constants"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

const getQueuedApiTrace = async (): Promise<{
  trace: QueuedApiTrace
  ctx: MetloContext
  version: number
}> => {
  try {
    const unsafeRedisClient = RedisClient.getInstance()
    const traceString = await unsafeRedisClient.lpop(TRACES_QUEUE)
    return JSON.parse(traceString)
  } catch (err) {
    mlog.withErr(err).error("Error getting queued trace")
    return null
  }
}

const main = async () => {
  const pool = new Piscina({
    filename: path.resolve(__dirname, "analyze-traces.js"),
    maxThreads: parseInt(process.env.NUM_WORKERS || "4"),
    idleTimeout: 10 * 60 * 1000, // 10 mins
    maxQueue: "auto",
  })

  while (true) {
    if (pool.queueSize === pool.options.maxQueue) {
      await sleep(10)
    } else {
      const queuedTask = await getQueuedApiTrace()
      if (queuedTask != null) {
        pool.run({ ...queuedTask })
      } else {
        await sleep(100)
      }
    }
  }
}
main()
