import { z } from "zod"

import { AssertionType, ExtractorType, Severity, Method } from "./enums"
import { IDRegex } from "./constants"

export const MetaSchema = z.object({
  name: z.string(),
  severity: Severity,
})

export const KeyValSchema = z.object({
  name: z.string(),
  value: z.string(),
})

export const RequestSchema = z.object({
  method: Method,
  url: z.union([z.string(), z.string().array()]),
  headers: KeyValSchema.array().optional(),
  query: KeyValSchema.array().optional(),
  form: KeyValSchema.array().optional(),
  data: z.string().optional(),
})

export const ExtractorSchema = z.object({
  name: z.string(),
  type: ExtractorType.default(ExtractorType.enum.VALUE),
  val: z.string(),
})

export const PrimitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
])

export const AssertionSchema = z.object({
  type: AssertionType.default(AssertionType.enum.EQ),
  key: z.string().optional(),
  val: z.union([PrimitiveValueSchema, PrimitiveValueSchema.array()]),
})

export const TestStepSchema = z.object({
  request: RequestSchema,
  extract: ExtractorSchema.array().optional(),
  assert: AssertionSchema.array().optional(),
})

export const TestConfigSchema = z.object({
  id: z.string().regex(IDRegex),
  meta: MetaSchema.optional(),
  test: TestStepSchema.array(),
})

export const ResultStepSchema = z.object({
  success: z.boolean(),
})

export const TestResultSchema = z.object({
  success: z.boolean(),
  results: ResultStepSchema.array(),
})

export type TestStep = z.infer<typeof TestStepSchema>
export type TestConfig = z.infer<typeof TestConfigSchema>
export type TestResult = z.infer<typeof TestResultSchema>
