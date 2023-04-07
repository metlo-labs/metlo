import MIMEType from "whatwg-mimetype"
import mlog from "logger"
import {
  Meta,
  ProcessedTraceData,
  QueuedApiTrace,
  SessionMeta,
  TraceParams,
} from "@common/types"
import Error500InternalServer from "errors/error-500-internal-server"
import { BlockFieldsService } from "services/block-fields"
import { AuthenticationConfigService } from "services/authentication-config"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "~/constants"
import { MetloContext } from "types"
import { getValidPath } from "utils"
import { AnalysisType } from "@common/enums"

const getContentType = (contentType: string) => {
  if (!contentType) {
    return "*/*"
  }
  try {
    const mimeType = new MIMEType(contentType)
    return mimeType.essence
  } catch {
    return "*/*"
  }
}

export const getQueuedApiTrace = async (
  ctx: MetloContext,
  traceParams: TraceParams,
): Promise<QueuedApiTrace | null> => {
  try {
    const validPath = getValidPath(traceParams?.request?.url?.path)
    if (!validPath.isValid) {
      mlog.debug(`Invalid Path: ${traceParams?.request?.url?.path}`)
      return null
    }

    const path = validPath.path
    const method = traceParams?.request?.method
    const host = traceParams?.request?.url?.host
    const requestParameters = traceParams?.request?.url?.parameters ?? []
    const requestHeaders = traceParams?.request?.headers ?? []
    const requestBody = traceParams?.request?.body
    const responseHeaders = traceParams?.response?.headers ?? []
    const responseBody = traceParams?.response?.body
    const responseStatus = traceParams?.response?.status
    const meta = traceParams?.meta ?? ({} as Meta)
    const processedTraceData =
      traceParams?.processedTraceData ?? ({} as ProcessedTraceData)
    processedTraceData.requestContentType = getContentType(
      processedTraceData.requestContentType,
    )
    processedTraceData.responseContentType = getContentType(
      processedTraceData.responseContentType,
    )
    const redacted = traceParams?.redacted
    const sessionMeta = traceParams?.sessionMeta ?? ({} as SessionMeta)
    const apiTraceObj: QueuedApiTrace = {
      path,
      method,
      host,
      requestParameters,
      requestHeaders,
      requestBody,
      responseStatus,
      responseHeaders,
      responseBody,
      meta,
      createdAt: new Date(),
      sessionMeta,
      processedTraceData,
      redacted,
      analysisType: traceParams?.analysisType ?? AnalysisType.FULL,
      graphqlPaths: traceParams.graphqlPaths,
    }

    if (!traceParams?.sessionMeta) {
      await AuthenticationConfigService.setSessionMetadata(ctx, apiTraceObj)
    }
    if (apiTraceObj.analysisType === AnalysisType.FULL) {
      await BlockFieldsService.redactBlockedFields(ctx, apiTraceObj)
    }
    return apiTraceObj
  } catch (err) {
    mlog.withErr(err).error("Error in getting queued api trace")
    return null
  }
}

export const logRequest = async (
  ctx: MetloContext,
  traceParams: TraceParams,
): Promise<void> => {
  mlog.debug("Called Log Request Service Func")
  const unsafeRedisClient = RedisClient.getInstance()
  try {
    let queueLength = 0
    try {
      queueLength = await unsafeRedisClient.llen(TRACES_QUEUE)
    } catch (err) {
      mlog.withErr(err).debug(`Error checking queue length`)
    }
    mlog.debug(`Trace queue length ${queueLength}`)
    if (queueLength > 1000) {
      mlog.debug("Trace queue overloaded")
      return
    }
    const apiTraceObj = await getQueuedApiTrace(ctx, traceParams)
    if (!apiTraceObj) {
      return
    }
    mlog.debug("Pushed trace to redis queue")
    await unsafeRedisClient.rpush(
      TRACES_QUEUE,
      JSON.stringify({
        ctx,
        version: 2,
        trace: apiTraceObj,
      }),
    )
  } catch (err) {
    if (err?.code < 500) {
      throw err
    }
    mlog.withErr(err).error("Error in Log Request service")
    throw new Error500InternalServer(err)
  }
}

export const logRequestBatch = async (
  ctx: MetloContext,
  traceParamsBatch: TraceParams[],
): Promise<void> => {
  mlog.debug("Called Log Request Service Func")
  const unsafeRedisClient = RedisClient.getInstance()
  try {
    let queueLength = 0
    try {
      queueLength = await unsafeRedisClient.llen(TRACES_QUEUE)
    } catch (err) {
      mlog.withErr(err).debug(`Error checking queue length`)
    }
    mlog.debug(`Trace queue length ${queueLength}`)
    if (queueLength > 1000) {
      mlog.debug("Trace queue overloaded")
      return
    }
    let queuedApiTraces: QueuedApiTrace[] = [];
    for (let i = 0; i < traceParamsBatch.length; i++) {
      const apiTraceObj = await getQueuedApiTrace(ctx, traceParamsBatch[i])
      if (!apiTraceObj) {
        continue
      }
      queuedApiTraces.push(apiTraceObj)
    }
    if (queuedApiTraces.length == 0) {
      return
    }
    mlog.debug("Pushed trace to redis queue")
    await unsafeRedisClient.rpush(
      TRACES_QUEUE,
      JSON.stringify({
        ctx,
        version: 2,
        traces: queuedApiTraces,
      }),
    )
  } catch (err) {
    if (err?.code < 500) {
      throw err
    }
    mlog.withErr(err).error("Error in Log Request service")
    throw new Error500InternalServer(err)
  }
}
