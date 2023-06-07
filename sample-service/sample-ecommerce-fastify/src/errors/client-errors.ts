import { Error400BadRequest } from "./error-400-bad-request"
import { Error401UnauthorizedRequest } from "./error-401-unauthorized"
import { Error404NotFound } from "./error-404-not-found"
import { Error409Conflict } from "./error-409-conflict"

export type ClientError =
  | Error400BadRequest
  | Error401UnauthorizedRequest
  | Error404NotFound
  | Error409Conflict

export const ClientErrorTypes = [
  Error400BadRequest,
  Error401UnauthorizedRequest,
  Error404NotFound,
  Error409Conflict,
]
