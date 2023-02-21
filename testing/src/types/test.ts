import { z } from "zod"

import {
  AssertionType,
  ExtractorType,
  Severity,
  PredefinedPayloadType,
  MethodSchema,
} from "./enums"
import { IDRegex } from "./constants"
import { Context } from "./context"

export const PrimitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
])

export const MetaSchema = z.object({
  name: z.string().optional(),
  severity: Severity.optional(),
  tags: z.string().array().optional(),
})

export const KeyValSchema = z.object({
  name: z.string(),
  value: PrimitiveValueSchema.transform(e => {
    if (typeof e == "string") {
      return e
    }
    return JSON.stringify(e)
  }),
})

export const RequestSchema = z.object({
  method: MethodSchema,
  url: z.string(),
  headers: KeyValSchema.array().optional(),
  query: KeyValSchema.array().optional(),
  form: KeyValSchema.array().optional(),
  data: z.string().optional(),
})

export const ExtractorSchema = z.object({
  name: z.string(),
  type: ExtractorType.default(ExtractorType.enum.VALUE),
  value: z.string(),
})

export const AssertionSchema = z.union([
  z.object({
    type: AssertionType.default(AssertionType.enum.EQ),
    key: z.string().optional(),
    value: z.union([PrimitiveValueSchema, PrimitiveValueSchema.array()]),
  }),
  z.string(),
])

export const PayloadSchema = z.object({
  key: z.string(),
  value: z.union([PredefinedPayloadType, z.string()]),
})

export const TestStepSchema = z.object({
  request: RequestSchema,
  extract: ExtractorSchema.array().optional(),
  assert: AssertionSchema.array().optional(),
  payload: PayloadSchema.array().optional(),
})

export const TestOptionsSchema = z.object({
  stopOnFailure: z.boolean().optional(),
})

export const TestConfigSchema = z.object({
  id: z.string().regex(IDRegex),
  meta: MetaSchema.optional(),
  env: KeyValSchema.array().optional(),
  test: TestStepSchema.array(),
  options: TestOptionsSchema.optional(),
})

export type TestMeta = z.infer<typeof MetaSchema>
export type Extractor = z.infer<typeof ExtractorSchema>
export type Assertion = z.infer<typeof AssertionSchema>
export type PayloadType = z.infer<typeof PayloadSchema>
export type KeyValType = z.infer<typeof KeyValSchema>
export type TestRequest = z.infer<typeof RequestSchema>
export type TestStep = z.infer<typeof TestStepSchema>
export type TestConfig = z.infer<typeof TestConfigSchema>
export type TestOptions = z.infer<typeof TestOptionsSchema>

export interface StepRequest {
  url: string
  method: string
  headers: Record<string, string>
  data?: string
}

export interface StepResponse {
  data: any
  status: number
  statusText: string
  headers: KeyValType[]
}

export interface StepResult {
  idx: number
  ctx: Context
  success: boolean
  err?: string
  errStack?: string
  assertions: boolean[]
  req: StepRequest
  res?: StepResponse
}

export interface FailedAssertion {
  stepIdx: number
  stepRunIdx: number
  assertionIdx: number
  ctx: Context
  assertion: Assertion
  stepReq: StepRequest
  res?: StepResponse
}

export interface FailedRequest {
  stepIdx: number
  stepRunIdx: number
  req: TestRequest
  stepReq: StepRequest
  ctx: Context
  err: string
}

export interface TestResult {
  success: boolean
  test?: TestConfig
  results: StepResult[][]
  abortedAt?: number
  timedOutIn?: number
}
