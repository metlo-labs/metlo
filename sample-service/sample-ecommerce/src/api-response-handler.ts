import { Response } from "express"
import { ClientError, ClientErrorTypes } from "errors/client-errors"

export default class ApiResponseHandler {
  static async success(res: Response, payload?: string | object | null) {
    if (payload !== undefined && payload !== null) {
      const resPayload =
        typeof payload === "object"
          ? {
              ok: true,
              ...payload,
            }
          : { ok: true, payload }
      res.status(200).send(resPayload)
    } else {
      res.sendStatus(200)
    }
  }

  static async error(res: Response, error?: Error) {
    const errorCode =
      error &&
      ClientErrorTypes.some(cet => error instanceof cet) &&
      [400, 401, 403, 404].includes((error as ClientError).code)
        ? (error as ClientError).code
        : 500
    res.status(errorCode).send(error.message)
  }
}
