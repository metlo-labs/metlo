import Queue, { JobId, Queue as QueueInterface } from "bull"
import kill from "tree-kill"
import schedule from "node-schedule"
import { DateTime } from "luxon"
import { JobName } from "services/jobs/types"
import { JOB_NAME_MAP } from "services/jobs/constants"

const defaultJobOptions = {
  removeOnFail: true,
  removeOnComplete: true,
}

const log = (logMessage: string, newLine?: boolean) =>
  console.log(
    `${newLine ? "\n" : ""}${DateTime.utc().toString()} ${logMessage}`,
  )

const killJob = (queue: QueueInterface, jobId: JobId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const job = await queue.getJob(jobId)

      if (!job) {
        return resolve(false)
      }

      kill(job.data.pid, "SIGTERM", err => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

const cleanQueue = async (queue: QueueInterface, graceMillis?: number) => {
  const gracePeriod = graceMillis ?? 0
  await queue.clean(gracePeriod, "active")
  await queue.clean(gracePeriod, "completed")
  await queue.clean(gracePeriod, "delayed")
  await queue.clean(gracePeriod, "failed")
  await queue.clean(gracePeriod, "paused")
  await queue.clean(gracePeriod, "wait")
}

const createQueue = (jobName: JobName) => {
  const queue = new Queue(`${jobName}_queue`, process.env.REDIS_URL, {
    defaultJobOptions,
  })
  queue.process(`${jobName}`, __dirname + "/services/jobs/processor.js")
  return queue
}

const main = async () => {
  const specQueue = createQueue(JobName.GENERATE_OPENAPI_SPEC)
  const unauthQueue = createQueue(JobName.CHECK_UNAUTH_ENDPOINTS)
  const monitorEndpointsHstsQueue = createQueue(JobName.MONITOR_ENDPOINT_HSTS)
  const clearApiTracesQueue = createQueue(JobName.CLEAR_API_TRACES)
  const updateEndpointIpsQueue = createQueue(JobName.UPDATE_ENDPOINT_IPS)
  const logAggregatedStatsQueue = createQueue(JobName.LOG_AGGREGATED_STATS)
  const fixEndpointsQueue = createQueue(JobName.FIX_ENDPOINTS)

  const queues: QueueInterface[] = [
    specQueue,
    unauthQueue,
    monitorEndpointsHstsQueue,
    clearApiTracesQueue,
    updateEndpointIpsQueue,
    logAggregatedStatsQueue,
    fixEndpointsQueue,
  ]

  schedule.scheduleJob("*/60 * * * *", async () => {
    await specQueue.add(
      `${JobName.GENERATE_OPENAPI_SPEC}`,
      {},
      { ...defaultJobOptions, jobId: JobName.GENERATE_OPENAPI_SPEC },
    )
  })

  schedule.scheduleJob("30 * * * *", async () => {
    await unauthQueue.add(
      `${JobName.CHECK_UNAUTH_ENDPOINTS}`,
      {},
      { ...defaultJobOptions, jobId: JobName.CHECK_UNAUTH_ENDPOINTS },
    )
  })

  schedule.scheduleJob("15 * * * *", async () => {
    await monitorEndpointsHstsQueue.add(
      `${JobName.MONITOR_ENDPOINT_HSTS}`,
      {},
      { ...defaultJobOptions, jobId: JobName.MONITOR_ENDPOINT_HSTS },
    )
  })

  schedule.scheduleJob("*/10 * * * *", async () => {
    await clearApiTracesQueue.add(
      `${JobName.CLEAR_API_TRACES}`,
      {},
      { ...defaultJobOptions, jobId: JobName.CLEAR_API_TRACES },
    )
  })

  schedule.scheduleJob("0 */4 * * *", async () => {
    await updateEndpointIpsQueue.add(
      `${JobName.UPDATE_ENDPOINT_IPS}`,
      {},
      { ...defaultJobOptions, jobId: JobName.UPDATE_ENDPOINT_IPS },
    )
  })

  if ((process.env.DISABLE_LOGGING_STATS || "false").toLowerCase() == "false") {
    schedule.scheduleJob("0 */6 * * *", async () => {
      await logAggregatedStatsQueue.add(
        `${JobName.LOG_AGGREGATED_STATS}`,
        {},
        { ...defaultJobOptions, jobId: JobName.LOG_AGGREGATED_STATS },
      )
    })
  } else {
    log("Logging Aggregated Stats Disabled...", true)
  }

  schedule.scheduleJob("*/15 * * * *", async () => {
    await fixEndpointsQueue.add(
      `${JobName.FIX_ENDPOINTS}`,
      {},
      { ...defaultJobOptions, jobId: JobName.FIX_ENDPOINTS },
    )
  })

  schedule.scheduleJob("* * * * *", async () => {
    for (const queue of queues) {
      const activeJobs = await queue.getActive()
      for (const job of activeJobs) {
        if (job) {
          const threshold = JOB_NAME_MAP[job.name as JobName].threshold
          if (Date.now() - job?.timestamp > threshold) {
            log(
              `Job ${job.name} taking too long, exceeded threshold of ${threshold} ms. Killing job with pid ${job.data?.pid}.`,
              true,
            )
            await killJob(queue, job.id)
          }
        }
      }
    }
  })

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(async () => {
      console.log("Stopping all queues and jobs...")
      for (const queue of queues) {
        const activeJobs = await queue.getActive()
        for (const job of activeJobs) {
          await killJob(queue, job.id)
        }
        await cleanQueue(queue)
        await queue.close()
      }
      process.exit(0)
    })
  })

  process.on("SIGTERM", () => {
    schedule.gracefulShutdown().then(async () => {
      console.log("Stopping all queues and jobs...")
      for (const queue of queues) {
        const activeJobs = await queue.getActive()
        for (const job of activeJobs) {
          await killJob(queue, job.id)
        }
        await cleanQueue(queue)
        await queue.close()
      }
      process.exit(0)
    })
  })
}

main()
