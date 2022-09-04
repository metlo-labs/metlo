import Error400BadRequest from "errors/error-400-bad-request"
import Error404NotFound from "errors/error-404-not-found"
import Error401Unauthorized from "./error-401-unauthorized"
import Error409Conflict from "./error-409-conflict"
import Error422UnprocessableEntity from "./error-422-unprocessable-entity"

export type ClientError =
  | Error400BadRequest
  | Error404NotFound
  | Error409Conflict
  | Error422UnprocessableEntity
  | Error401Unauthorized

export const ClientErrorTypes = [
  Error400BadRequest,
  Error404NotFound,
  Error409Conflict,
  Error422UnprocessableEntity,
  Error401Unauthorized,
]
