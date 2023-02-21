import { v4 as uuidv4 } from "uuid"

import {
  Assertion,
  Extractor,
  PayloadType,
  KeyValType,
  TestConfig,
  TestMeta,
  TestRequest,
  TestStep,
  TestOptions,
} from "../types/test"
import {
  addAuthToRequest,
  makeSampleRequest,
  makeSampleRequestNoAuth,
} from "./sample-request"
import { GenTestContext, GenTestEndpoint } from "./types"

export class TestStepBuilder {
  request: TestRequest
  extractors: Extractor[]
  assertions: Assertion[]
  payloads: PayloadType[]
  env: KeyValType[]

  constructor(request: TestRequest) {
    this.request = request
    this.extractors = []
    this.assertions = []
    this.payloads = []
    this.env = []
  }

  static sampleRequest(endpoint: GenTestEndpoint, name?: string) {
    const generatedRequest = makeSampleRequest(endpoint, name)
    return new TestStepBuilder(generatedRequest.req).addToEnv(
      ...generatedRequest.env,
    )
  }

  static sampleRequestWithoutAuth(endpoint: GenTestEndpoint, name?: string) {
    const generatedRequest = makeSampleRequestNoAuth(endpoint, name)
    return new TestStepBuilder(generatedRequest.req).addToEnv(
      ...generatedRequest.env,
    )
  }

  addAuth(endpoint: GenTestEndpoint, name?: string): TestStepBuilder {
    const currentRequest = this.request
    const ctx: GenTestContext = { endpoint, prefix: name, entityMap: {} }
    const gen = addAuthToRequest({ req: currentRequest, env: [] }, ctx)
    this.request = gen.req
    this.env.push(...gen.env)
    return this
  }

  setRequest(request: TestRequest): TestStepBuilder {
    this.request = request
    return this
  }

  modifyRequest(f: (old: TestRequest) => TestRequest): TestStepBuilder {
    this.request = f(this.request)
    return this
  }

  assert(assertion: Assertion): TestStepBuilder {
    this.assertions.push(assertion)
    return this
  }

  addPayloads(payload: PayloadType): TestStepBuilder {
    this.payloads.push(payload)
    return this
  }

  extract(item: Extractor): TestStepBuilder {
    this.extractors.push(item)
    return this
  }

  addToEnv(...items: KeyValType[]): TestStepBuilder {
    this.env.push(...items)
    return this
  }

  getStep(): TestStep {
    let out: TestStep = {
      request: this.request,
    }
    if (this.extractors.length > 0) {
      out.extract = this.extractors
    }
    if (this.assertions.length > 0) {
      out.assert = this.assertions
    }
    if (this.payloads.length > 0) {
      out.payload = this.payloads
    }
    return out
  }
}

export class TestBuilder {
  id: string
  opts: TestOptions
  meta: TestMeta
  currentEnvKeys: Set<string>
  env: KeyValType[]
  test: TestStep[]

  constructor() {
    this.meta = {}
    this.opts = {}
    this.id = uuidv4()
    this.currentEnvKeys = new Set()
    this.env = []
    this.test = []
  }

  setMeta(meta: TestMeta): TestBuilder {
    this.meta = { ...this.meta, ...meta }
    return this
  }

  setOptions(opts: TestOptions): TestBuilder {
    this.opts = { ...this.opts, ...opts }
    return this
  }

  addToEnv(item: KeyValType): TestBuilder {
    if (this.currentEnvKeys.has(item.name)) {
      return this
    }
    this.currentEnvKeys.add(item.name)
    this.env.push(item)
    return this
  }

  addTestStep(stepBuilder: TestStepBuilder): TestBuilder {
    const filteredEnv = stepBuilder.env.filter(
      e => !this.currentEnvKeys.has(e.name),
    )
    this.currentEnvKeys = new Set([
      ...this.currentEnvKeys,
      ...filteredEnv.map(e => e.name),
    ])
    this.test.push(stepBuilder.getStep())
    this.env.push(...filteredEnv)
    return this
  }

  getTest(): TestConfig {
    return {
      id: this.id,
      options: this.opts,
      meta: this.meta,
      env: this.env,
      test: this.test,
    }
  }
}
