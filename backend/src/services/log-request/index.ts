import { Meta, QueuedApiTrace, SessionMeta, TraceParams } from "@common/types"
import Error500InternalServer from "errors/error-500-internal-server"
import { BlockFieldsService } from "services/block-fields"
import { AuthenticationConfigService } from "services/authentication-config"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "~/constants"
import { MetloContext } from "types"
import { getValidPath } from "utils"

export class LogRequestService {
  static async logRequest(
    ctx: MetloContext,
    traceParams: TraceParams,
  ): Promise<void> {
    const unsafeRedisClient = RedisClient.getInstance()
    try {
      /** Log Request in ApiTrace table **/
      let queueLength = 0
      try {
        queueLength = await unsafeRedisClient.llen(TRACES_QUEUE)
      } catch {}
      if (queueLength > 1000) {
        return
      }

      const validPath = getValidPath(traceParams?.request?.url?.path)
      if (!validPath.isValid) {
        return
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
        sessionMeta: {} as SessionMeta,
      }

      await BlockFieldsService.redactBlockedFields(ctx, apiTraceObj)
      await AuthenticationConfigService.setSessionMetadata(ctx, apiTraceObj)

      await unsafeRedisClient.rpush(
        TRACES_QUEUE,
        JSON.stringify({
          ctx,
          trace: apiTraceObj,
        }),
      )
    } catch (err) {
      console.error(`Error in Log Request service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }

  static async logRequestBatch(
    ctx: MetloContext,
    traceParamsBatch: TraceParams[],
  ): Promise<void> {
    for (let i = 0; i < traceParamsBatch.length; i++) {
      await this.logRequest(ctx, traceParamsBatch[i])
    }
  }
}
