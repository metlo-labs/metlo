import { v4 as uuidv4 } from "uuid"

import {
  Assertion,
  Extractor,
  KeyValType,
  TestConfig,
  TestMeta,
  TestRequest,
  TestStep,
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
  env: KeyValType[]

  constructor(request: TestRequest) {
    this.request = request
    this.extractors = []
    this.assertions = []
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
    const ctx: GenTestContext = { endpoint, prefix: name }
    const gen = addAuthToRequest({ req: currentRequest, env: [] }, ctx)
    this.request = gen.req
    this.env.push(...gen.env)
    return this
  }

  setRequest(request: TestRequest): TestStepBuilder {
    this.request = request
    return this
  }

  assert(assertion: Assertion): TestStepBuilder {
    this.assertions.push(assertion)
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
    return out
  }
}

export class TestBuilder {
  id: string
  meta: TestMeta
  currentEnvKeys: Set<string>
  env: KeyValType[]
  test: TestStep[]

  constructor() {
    this.meta = {}
    this.id = uuidv4()
    this.currentEnvKeys = new Set()
    this.env = []
    this.test = []
  }

  setMeta(meta: TestMeta): TestBuilder {
    this.meta = meta
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

  addTest(stepBuilder: TestStepBuilder): TestBuilder {
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
      meta: this.meta,
      env: this.env,
      test: this.test,
    }
  }
}
