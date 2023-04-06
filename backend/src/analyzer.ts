import path from "path"
import Piscina from "piscina"
import mlog from "logger"
import { QueuedApiTrace } from "@common/types"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "./constants"
import { isGraphQlEndpoint } from "services/graphql"
import { AnalysisType } from "@common/enums"
import { createGraphQlTraces, shouldSkipDataFields } from "utils"
import { AppDataSource } from "data-source"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

interface TraceTask {
  ctx: MetloContext
  version: number
  trace?: QueuedApiTrace
  partialTraces?: QueuedApiTrace[]
  hasValidEnterpriseLicense?: boolean
  analysisType?: AnalysisType
}

const pool = new Piscina({
  filename: path.resolve(__dirname, "analyze-traces.js"),
  maxThreads: parseInt(process.env.NUM_WORKERS || "4"),
  idleTimeout: 10 * 60 * 1000,
  maxQueue: 4096,
})

const getQueuedApiTrace = async (): Promise<TraceTask> => {
  try {
    const unsafeRedisClient = RedisClient.getInstance()
    const traceString = await unsafeRedisClient.lpop(TRACES_QUEUE)
    return JSON.parse(traceString)
  } catch (err) {
    mlog.withErr(err).error("Error getting queued trace")
    return null
  }
}

const runTrace = async (task: TraceTask) => {
  try {
    const startRunTrace = performance.now()
    const singleTrace = task.trace
    const mapped_host_res: { mappedHost: string | null; isBlocked: boolean } =
      await pool.run({
        type: "get_mapped_host",
        task: {
          ctx: task.ctx,
          host: singleTrace.host,
          tracePath: singleTrace.path,
        },
      })
    if (mapped_host_res.isBlocked) {
      mlog.count("analyzer.blocked_host_skipped_count")
      return
    }
    if (mapped_host_res.mappedHost) {
      singleTrace.originalHost = singleTrace.host
      singleTrace.host = mapped_host_res.mappedHost
    }

    let traces: QueuedApiTrace[] = [singleTrace]
    const isGraphQl = isGraphQlEndpoint(singleTrace.path)
    if (isGraphQl && task.version === 2) {
      const startCreateGraphQlTraces = performance.now()
      traces = createGraphQlTraces(singleTrace)
      mlog.time(
        "analyzer.create_graphql_traces",
        performance.now() - startCreateGraphQlTraces,
      )
    }
    for (const traceItem of traces) {
      const start = performance.now()
      const endpoint = await pool.run({
        type: "get_endpoint",
        task: {
          ctx: task.ctx,
          trace: traceItem,
        },
      })

      const start_skip_data_fields = performance.now()
      const skipDataFields =
        endpoint &&
        (await shouldSkipDataFields(
          task.ctx,
          endpoint.uuid,
          traceItem.responseStatus,
        ))
      mlog.time(
        "analyzer.skip_data_fields",
        performance.now() - start_skip_data_fields,
      )

      await pool.run({
        type: "analyze",
        task: {
          ...task,
          isGraphQl: isGraphQl,
          apiEndpoint: endpoint,
          trace: traceItem,
          skipDataFields: skipDataFields,
        },
      })
      mlog.time("analyzer.total_analysis", performance.now() - start)
    }
    mlog.time("analyzer.total_run_trace", performance.now() - startRunTrace)
  } catch (err) {
    mlog.withErr(err).error("Encountered error while analyzing traces")
  }
}

const runPartialTraces = async (task: TraceTask) => {
  await pool.run({
    type: "analyze_partial_traces",
    task: {
      ...task,
    },
  })
}

const main = async () => {
  const hasValidEnterpriseLicense = false
  await AppDataSource.initialize()
  mlog.info("AppDataSource Initialized...")
  mlog.info("Running Analyzer...")
  while (true) {
    if (pool.queueSize >= 32) {
      await sleep(100)
    } else {
      const queuedTask = await getQueuedApiTrace()
      if (queuedTask != null) {
        queuedTask.hasValidEnterpriseLicense = hasValidEnterpriseLicense
        if (queuedTask.analysisType === AnalysisType.PARTIAL) {
          runPartialTraces(queuedTask)
        } else {
          runTrace(queuedTask)
        }
      } else {
        await sleep(50)
      }
    }
  }
}

main()
