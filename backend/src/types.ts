import { Request } from "express"

export interface MetloContext { }

export interface MetloRequest extends Request {
  ctx?: MetloContext
}

export enum LoginType {
  GITHUB = "github",
  GOOGLE = "google"
}