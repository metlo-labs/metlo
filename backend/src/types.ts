import { Request } from "express"

export interface MetloContext {}

export interface MetloRequest extends Request {
  ctx?: MetloContext
}
