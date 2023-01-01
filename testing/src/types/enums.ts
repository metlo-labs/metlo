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
