import { FastifyReply } from "fastify"
import { ClientError, ClientErrorTypes } from "errors/client-errors"

export default class ApiResponseHandler {
  static async success(res: FastifyReply, payload?: string | object | null) {
    if (payload !== undefined && payload !== null) {
      const resPayload =
        typeof payload === "object"
          ? {
              ok: true,
              ...payload,
            }
          : { ok: true, payload }
      res.code(200)
      res.send(resPayload)
    } else {
      res.code(200)
    }
  }

  static async error(res: FastifyReply, error?: Error) {
    const errorCode =
      error &&
      ClientErrorTypes.some(cet => error instanceof cet) &&
      [400, 401, 403, 404].includes((error as ClientError).code)
        ? (error as ClientError).code
        : 500
    res.code(errorCode)
    res.send(error.message)
  }
}
