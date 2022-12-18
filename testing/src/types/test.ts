import { z } from "zod"

import { AssertionType, ExtractorType, Severity, Method } from "./enums"
import { IDRegex } from "./constants"
import { Context } from "./context"

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
  url: z.string(),
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
  // key: z.string().optional(),
  key: z.string(),
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

export type Extractor = z.infer<typeof ExtractorSchema>
export type Assertion = z.infer<typeof AssertionSchema>
export type TestRequest = z.infer<typeof RequestSchema>
export type TestStep = z.infer<typeof TestStepSchema>
export type TestConfig = z.infer<typeof TestConfigSchema>

export interface StepResult {
  idx: number
  ctx: Context
  success: boolean
  err: string
  assertions: boolean[]
}

export interface TestResult {
  success: boolean
  results: StepResult[][]
}
