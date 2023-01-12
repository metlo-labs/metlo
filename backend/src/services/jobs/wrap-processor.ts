import mlog from "logger"
import { Job } from "bull"

export const wrapProcessor = processor => {
  const wrappedProcessor = async (job: Job) => {
    const exitHandler = exitCode => {
      mlog.debug(
        `\nReceived SIGTERM for job id '${job.id}' with exit code '${exitCode}' and PID '${process.pid}'`,
      )
      job.discard()
      process.exit(15)
    }

    process.on("SIGTERM", exitHandler)

    try {
      await job.update({ ...job.data, pid: process.pid })

      const result = await processor(job)

      return result
    } finally {
      process.removeListener("SIGTERM", exitHandler)
    }
  }
  return wrappedProcessor
}
