import { AxiosResponse, AxiosRequestConfig } from "axios"
import { TestResult } from "types"

interface TestContext {
  request: AxiosRequestConfig
  response: AxiosResponse
}

class MetloTester {
  tests: Map<string, () => void>
  request: AxiosRequestConfig
  response: AxiosResponse

  constructor(request: AxiosRequestConfig, response: AxiosResponse) {
    this.tests = new Map()
    this.request = request
    this.response = response
  }

  test(name: string, func: () => void) {
    if (this.tests.has(name)) {
      throw new Error(`Test with name (${name}) already exists...`)
    }
    this.tests.set(name, func)
  }

  runTest(name: string, func: () => void): TestResult {
    let success = true
    let output = ""
    try {
      func()
    } catch (e) {
      success = false
      output = e.message
    }
    return {
      name,
      success,
      output,
    }
  }

  run(): TestResult[] {
    global.m = {
      request: this.request,
      response: this.response,
    } as TestContext
    return Array.from(this.tests).map(([name, test]) =>
      this.runTest(name, test as any),
    )
  }
}

export default MetloTester
