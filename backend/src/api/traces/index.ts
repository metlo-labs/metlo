import { Response, Router } from "express"
import { MetloRequest } from "types"

import { GetTracesParams } from "@common/api/trace"
import ApiResponseHandler from "api-response-handler"
import { getRepoQB } from "services/database/utils"
import { ApiTrace } from "models"

const getTracesHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedQuery = GetTracesParams.safeParse(req.query)
  if (parsedQuery.success == false) {
    return await ApiResponseHandler.zerr(res, parsedQuery.error)
  }
  const q = parsedQuery.data
  try {
    let qb = getRepoQB(req.ctx, ApiTrace)
    if (q.method) {
      qb.andWhere("method = :method", { method: q.method })
    }
    if (q.pathRegex) {
      qb.andWhere("path ~ :path", { path: q.pathRegex })
    }
    if (q.hostRegex) {
      qb.andWhere("host ~ :host", { host: q.hostRegex })
    }
    const traces = await qb
      .limit(q.limit || 20)
      .offset(q.offset || 0)
      .getMany()
    await ApiResponseHandler.success(res, traces)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerTracesRoutes(router: Router) {
  router.get("/api/v1/traces", getTracesHandler)
}
