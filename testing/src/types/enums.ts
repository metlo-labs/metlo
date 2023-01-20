import { z } from "zod"

export const Severity = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const Method = z.enum([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "PATCH",
])

export const AssertionType = z.enum(["EQ", "REGEXP", "JS"])
export const ExtractorType = z.enum(["VALUE", "JS", "REGEXP", "HTML"])
export const PredefinedPayloadTypeArray = [
  "XSS",
  "SQLI",
  "SQLI_AUTH_BYPASS",
  "SQLI_TIME",
] as [string, ...string[]]
export const PredefinedPayloadType = z.enum(PredefinedPayloadTypeArray)
