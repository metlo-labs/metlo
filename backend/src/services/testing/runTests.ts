import newman, { NewmanRunSummary } from "newman"
import {
  CollectionDefinition,
  RequestDefinition,
  RequestBodyDefinition,
} from "postman-collection"
import { RequestBodyType } from "@common/testing/enums"
import { Request, Result } from "@common/testing/types"
import { Test } from "@common/testing/types"

const requestToItem = (e: Request, i: number) => {
  const event = e.tests.trim()
    ? [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: e.tests.split("\n"),
          },
        },
      ]
    : []
  let body: RequestBodyDefinition = { mode: "raw" }
  if (e.body.type == RequestBodyType.JSON) {
    body.raw = e.body.data as string
  }
  let url: string = e.url
  if (e.params.length > 0) {
    url = `${url}?${e.params.map(p => `${p.key}=${p.value}`).join("&")}`
  }
  let item = {
    name: `Request ${i}`,
    event: event,
    request: {
      url: e.url,
      method: e.method,
      header: e.headers,
      body: body,
    } as RequestDefinition,
  }
  return item
}

export const mapNewmanResult = (e: NewmanRunSummary): Result[] => {
  return e.run.executions.map((execution, i) => {
    // @ts-ignore
    if (!execution.response) {
      return {
        body: "",
        headers: [],
        code: 0,
        statusText: "",
        duration: 0,
        testResults: (execution.assertions || []).map(e => ({
          name: e.assertion,
          success: !e.error,
          output: JSON.stringify(e.error, null, 4),
        })),
        // @ts-ignore
        error: JSON.stringify(execution.requestError, null, 4),
      }
    }
    return {
      // @ts-ignore
      body: execution.response.stream.toString(),
      // @ts-ignore
      headers: (execution.response || []).headers.map((h: any) => ({
        key: h.key,
        value: h.value,
      })),
      // @ts-ignore
      code: execution.response.code,
      // @ts-ignore
      statusText: execution.response.status,
      // @ts-ignore
      duration: execution.response.responseTime,
      testResults: (execution.assertions || []).map(e => ({
        name: e.assertion,
        success: !e.error,
        output: JSON.stringify(e.error, null, 4),
      })),
    }
  })
}

export const runTest = (e: Test): Promise<Result[]> => {
  const items = e.requests.map(requestToItem)
  const collection: CollectionDefinition = {
    info: {
      name: "Postman Collection",
    },
    item: items,
  }
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection,
      },
      (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(mapNewmanResult(res))
      },
    )
  })
}
