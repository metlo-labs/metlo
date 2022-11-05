import { Meta, QueuedApiTrace, SessionMeta, TraceParams } from "@common/types"
import Error500InternalServer from "errors/error-500-internal-server"
import { BlockFieldsService } from "services/block-fields"
import { AuthenticationConfigService } from "services/authentication-config"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "~/constants"
import { MetloContext } from "types"

export class LogRequestService {
  static async logRequest(
    ctx: MetloContext,
    traceParams: TraceParams,
  ): Promise<void> {
    try {
      /** Log Request in ApiTrace table **/
      const queueLength = await RedisClient.getListLength(ctx, TRACES_QUEUE)
      if (queueLength > 1000) {
        return
      }
      const path = traceParams?.request?.url?.path
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

      await BlockFieldsService.redactBlockedFields(apiTraceObj)
      await AuthenticationConfigService.setSessionMetadata(ctx, apiTraceObj)

      RedisClient.pushValueToRedisList(
        ctx,
        TRACES_QUEUE,
        [JSON.stringify(apiTraceObj)],
        true,
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
