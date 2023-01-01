import { Response } from "express"
import { z } from "zod"
import { ClientErrorTypes, ClientError } from "errors/client-errors"

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
    res.status(errorCode).send(error.message)
  }

  static async zerr(res: Response, error: z.ZodError): Promise<void> {
    res.status(400).send({
      type: "ZOD",
      err: error,
      message: error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join("\n"),
    })
  }
}
