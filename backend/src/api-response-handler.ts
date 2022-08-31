import { Response } from "express"
import { ClientErrorTypes, ClientError } from "errors/client-errors"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"

export default class ApiResponseHandler {
  static async success(
    res: Response,
    payload?: string | object | null,
  ): Promise<void> {
    if (payload !== undefined && payload !== null) {
      res.status(200).send(payload)
    } else {
      res.sendStatus(200)
    }
  }

  static async error(res: Response, error?: Error): Promise<void> {
    const errorCode =
      error &&
      ClientErrorTypes.some(cet => error instanceof cet) &&
      [400, 401, 403, 404, 409, 422].includes((error as ClientError).code)
        ? (error as ClientError).code
        : 500
    const payload = (error as Error422UnprocessableEntity).paylod ?? null
    res.status(errorCode).send(payload ?? error.message)
  }
}
