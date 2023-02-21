import { z } from "zod"

export enum AuthType {
  BASIC = "basic",
  HEADER = "header",
  JWT = "jwt",
  SESSION_COOKIE = "session_cookie",
}

export enum RestMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  PATCH = "PATCH",
}

export const Severity = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const MethodSchema = z.nativeEnum(RestMethod)

export const AssertionType = z.enum(["EQ", "REGEXP", "JS"])
export const ExtractorType = z.enum(["VALUE", "JS", "REGEXP", "HTML"])
export const PredefinedPayloadTypeArray = [
  "XSS",
  "SQLI",
  "SQLI_AUTH_BYPASS",
  "SQLI_TIME",
] as [string, ...string[]]
export const PredefinedPayloadType = z.enum(PredefinedPayloadTypeArray)
