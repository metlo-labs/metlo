import path from "path"
import Piscina from "piscina"
import mlog from "logger"
import { ProcessedTraceData, QueuedApiTrace } from "@common/types"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { GRAPHQL_SECTIONS, TRACES_QUEUE } from "./constants"
import { isGraphQlEndpoint } from "services/graphql"
import { AnalysisType, DataSection } from "@common/enums"
import { shouldSkipDataFields } from "utils"
import { AppDataSource } from "data-source"
import { IgnoredDetection } from "services/metlo-config/types"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

interface TraceTask {
  trace?: QueuedApiTrace
  traces?: QueuedApiTrace[]
  ctx: MetloContext
  version: number
  hasValidEnterpriseLicense?: boolean
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

const filteredProcessedData = (
  processedDataEntry: Record<string, any>,
  filter: string,
) => {
  const entry = {}
  Object.keys(processedDataEntry ?? {}).forEach(e => {
    const split = e.split(".")
    const isGraphqlSection = GRAPHQL_SECTIONS.includes(split[0] as DataSection)
    if (
      (isGraphqlSection &&
        (e.includes(`${filter}.`) || e === `${split[0]}.${filter}`)) ||
      !isGraphqlSection
    ) {
      entry[e] = processedDataEntry[e]
    }
  })
  return entry
}

const getProcessedTraceData = (
  processedTraceData: ProcessedTraceData,
  filter: string,
): ProcessedTraceData => {
  return {
    ...processedTraceData,
    attackDetections: filteredProcessedData(
      processedTraceData?.attackDetections,
      filter,
    ),
    xssDetected: filteredProcessedData(processedTraceData?.xssDetected, filter),
    sqliDetected: filteredProcessedData(
      processedTraceData?.sqliDetected,
      filter,
    ),
    sensitiveDataDetected: filteredProcessedData(
      processedTraceData?.sensitiveDataDetected,
      filter,
    ),
    dataTypes: filteredProcessedData(processedTraceData?.dataTypes, filter),
  }
}

const createGraphQlTraces = (trace: QueuedApiTrace): QueuedApiTrace[] => {
  const processedTraceData = trace?.processedTraceData
  if (processedTraceData?.graphqlPaths) {
    const traces: QueuedApiTrace[] = []
    for (const path of processedTraceData.graphqlPaths) {
      const splitPath = path.split(".")
      if (
        splitPath[1] === "query" ||
        splitPath[1] === "mutation" ||
        splitPath[1] === "subscription"
      ) {
        const filter = splitPath[1] + "." + splitPath[2]
        traces.push({
          ...trace,
          path: `${trace.path}.${filter}`,
          processedTraceData: getProcessedTraceData(processedTraceData, filter),
        })
      }
    }
    return traces
  } else {
    const traces: Record<string, QueuedApiTrace> = {}
    for (const operationPath in processedTraceData.dataTypes) {
      if (
        operationPath.includes("query.") ||
        operationPath.includes("mutation.") ||
        operationPath.includes("subscription.")
      ) {
        const splitPath = operationPath.split(".")
        const filter = splitPath[1] + "." + splitPath[2]
        if (!traces[filter]) {
          traces[filter] = {
            ...trace,
            path: `${trace.path}.${filter}`,
            processedTraceData: getProcessedTraceData(
              processedTraceData,
              filter,
            ),
          }
        }
      }
    }
    return Object.values(traces)
  }
}

const createGraphqlTracesPartial = (
  trace: QueuedApiTrace,
): QueuedApiTrace[] => {
  const traces: QueuedApiTrace[] = []
  const graphqlPaths = trace.processedTraceData?.graphqlPaths ?? []
  for (const path of graphqlPaths) {
    const splitPath = path.split(".")
    if (
      splitPath[1] === "query" ||
      splitPath[1] === "mutation" ||
      splitPath[1] === "subscription"
    ) {
      const filter = splitPath[1] + "." + splitPath[2]
      traces.push({
        ...trace,
        path: `${trace.path}.${filter}`,
        processedTraceData: {
          ...trace.processedTraceData,
          attackDetections: filteredProcessedData(
            trace.processedTraceData?.attackDetections,
            filter,
          ),
        },
      })
    }
  }
  return traces
}

const runFullAnalysis = async (
  task: TraceTask,
  singleTrace: QueuedApiTrace,
) => {
  const startRunTrace = performance.now()
  const mapped_host_res: {
    mappedHost: string | null
    isBlocked: boolean
    ignoredDetections: IgnoredDetection[]
  } = await pool.run({
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
        ignoredDetections: mapped_host_res?.ignoredDetections ?? [],
      },
    })
    mlog.time("analyzer.total_analysis", performance.now() - start)
  }
  mlog.time("analyzer.total_run_trace", performance.now() - startRunTrace)
}

const runPartialAnalysisBulk = async (
  task: TraceTask,
  traces: QueuedApiTrace[],
) => {
  const startRunTraces = performance.now()
  const mapped_host_res: {
    mappedHost: string | null
    isBlocked: boolean
    ignoredDetections: IgnoredDetection[]
  }[] = await pool.run({
    type: "get_mapped_host",
    task: traces.map(e => ({
      ctx: task.ctx,
      host: e.host,
      tracePath: e.path,
    })),
  })
  mlog.time("analyzer.bulk_get_mapped_host", performance.now() - startRunTraces)

  let mappedTraces: QueuedApiTrace[] = []
  for (let i = 0; i < mapped_host_res.length; i++) {
    if (mapped_host_res[i].isBlocked) {
      mlog.count("analyzer.blocked_host_skipped_count")
      continue
    }
    let trace = traces[i]
    if (mapped_host_res[i].mappedHost) {
      trace.originalHost = trace.host
      trace.host = mapped_host_res[i].mappedHost
    }
    mappedTraces.push(trace)
  }

  let graphqlSplitTraces: QueuedApiTrace[] = []
  for (const trace of mappedTraces) {
    const isGraphQl = isGraphQlEndpoint(trace.path)
    if (trace.graphqlPaths) {
      for (const graphqlPath of trace.graphqlPaths) {
        graphqlSplitTraces.push({
          ...trace,
          path: `${trace.path}.${graphqlPath}`,
          graphqlPaths: undefined,
        })
      }
    } else if (isGraphQl && task.version === 2) {
      graphqlSplitTraces = graphqlSplitTraces.concat(
        createGraphqlTracesPartial(trace),
      )
    } else {
      graphqlSplitTraces.push(trace)
    }
  }

  const startBulkGetEndpoints = performance.now()
  const endpoints = await pool.run({
    type: "get_endpoint",
    task: graphqlSplitTraces.map(e => ({
      ctx: task.ctx,
      trace: e,
    })),
  })
  mlog.time(
    "analyzer.bulk_get_endpoints",
    performance.now() - startBulkGetEndpoints,
  )

  const startAnalyzePartial = performance.now()
  await pool.run({
    type: "analyze_partial_bulk",
    task: {
      ...task,
      traces: graphqlSplitTraces,
      apiEndpointUUIDs: endpoints.map(e => e?.uuid),
      ignoredDetections: mapped_host_res?.[0]?.ignoredDetections ?? [],
    },
  })
  mlog.time(
    "analyzer.total_analysis_partial",
    performance.now() - startAnalyzePartial,
  )
  mlog.time(
    "analyzer.total_trace_analysis_partial",
    performance.now() - startRunTraces,
  )
}

const runTrace = async (task: TraceTask) => {
  try {
    if (task.trace) {
      const singleTrace = task.trace
      if (
        (singleTrace.analysisType ?? AnalysisType.FULL) == AnalysisType.FULL
      ) {
        runFullAnalysis(task, singleTrace)
      } else {
        runPartialAnalysisBulk(task, [singleTrace])
      }
    }
    if (task.traces) {
      runPartialAnalysisBulk(task, task.traces)
    }
  } catch (err) {
    mlog.withErr(err).error("Encountered error while analyzing traces")
  }
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
        runTrace(queuedTask)
      } else {
        await sleep(50)
      }
    }
  }
}

main()
