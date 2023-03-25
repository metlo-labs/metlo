import { DataType } from "@common/enums"
import {
  getDataType,
  getPathRegex,
  getValidPath,
  parsedJson,
  parsedJsonNonNull,
} from "utils"
import { PairObject, QueuedApiTrace } from "@common/types"
import { isSensitiveDataKey } from "./utils"
import { MetloContext } from "types"
import {
  getHostMapCached,
  getMetloConfigProcessedCached,
} from "services/metlo-config"
import { DisablePaths } from "services/metlo-config/types"

interface DisablePathsObjSet {
  reqQuery: Set<string>
  reqHeaders: Set<string>
  reqBody: Set<string>
  resHeaders: Set<string>
  resBody: Set<string>
}

interface DisablePathsObj {
  reqQuery: string[]
  reqHeaders: string[]
  reqBody: string[]
  resHeaders: string[]
  resBody: string[]
}

const updateDisabledPaths = (
  disablePathsObj: DisablePathsObjSet,
  disabledPaths: string[],
) => {
  disabledPaths.forEach(path => {
    if (path.includes("req.query")) disablePathsObj.reqQuery.add(path)
    else if (path.includes("req.headers")) disablePathsObj.reqHeaders.add(path)
    else if (path.includes("req.body")) disablePathsObj.reqBody.add(path)
    else if (path.includes("res.headers")) disablePathsObj.resHeaders.add(path)
    else if (path.includes("res.body")) disablePathsObj.resBody.add(path)
  })
}

export const getDisabledPaths = async (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
): Promise<DisablePathsObj> => {
  const metloConfig = await getMetloConfigProcessedCached(ctx)
  const blockFields = metloConfig?.blockFields
  if (!blockFields) {
    return {
      reqQuery: [],
      reqHeaders: [],
      reqBody: [],
      resHeaders: [],
      resBody: [],
    }
  }
  const hostMap = await getHostMapCached(ctx)
  let currHost = apiTrace.host
  for (const e of hostMap) {
    const match = apiTrace.host.match(e.pattern)
    if (match && match[0].length === apiTrace.host.length) {
      currHost = e.host
      break
    }
  }
  const disablePathsObj = {
    reqQuery: new Set<string>(),
    reqHeaders: new Set<string>(),
    reqBody: new Set<string>(),
    resHeaders: new Set<string>(),
    resBody: new Set<string>(),
  }
  const hostEntry = blockFields[currHost]
  if (hostEntry) {
    if (hostEntry["ALL"]) {
      const disabledPaths =
        (hostEntry["ALL"] as DisablePaths).disable_paths ?? []
      updateDisabledPaths(disablePathsObj, disabledPaths)
    }
    for (const endpoint in hostEntry) {
      if (endpoint && endpoint !== "ALL") {
        const validPath = getValidPath(endpoint)
        if (!validPath.isValid) {
          continue
        }
        const validPathString = validPath.path
        const pathRegex = getPathRegex(validPathString)
        const regex = new RegExp(pathRegex)
        if (!regex.test(apiTrace.path)) {
          continue
        }
        if (hostEntry[endpoint]["ALL"]) {
          const disabledPaths =
            hostEntry[endpoint]["ALL"]["disable_paths"] ?? []
          updateDisabledPaths(disablePathsObj, disabledPaths)
        }
        if (hostEntry[endpoint][apiTrace.method]) {
          const disablePaths =
            hostEntry[endpoint][apiTrace.method]["disable_paths"] ?? []
          updateDisabledPaths(disablePathsObj, disablePaths)
        }
      }
    }
  }
  return {
    reqQuery: [...disablePathsObj.reqQuery],
    reqHeaders: [...disablePathsObj.reqHeaders],
    reqBody: [...disablePathsObj.reqBody],
    resHeaders: [...disablePathsObj.resHeaders],
    resBody: [...disablePathsObj.resBody],
  }
}

const isContained = (arr: string[], str: string): boolean => {
  const strLower = str.toLowerCase()
  for (const e of arr) {
    const entryLower = e.toLowerCase().trim()
    if (entryLower === strLower) {
      return true
    }
  }
  return false
}

const recursiveParseBody = (
  dataPath: string,
  dataSection: string,
  jsonBody: any,
  disabledPaths: string[],
  redacted: boolean,
): any => {
  const dataType = getDataType(jsonBody)
  const path = dataPath ? `${dataSection}.${dataPath}` : dataSection
  if (dataType === DataType.OBJECT) {
    for (const key in jsonBody) {
      const contained = isContained(disabledPaths, `${path}.${key}`)
      if (redacted || contained || isSensitiveDataKey(key)) {
        jsonBody[key] = recursiveParseBody(
          `${dataPath}.${key}`,
          dataSection,
          jsonBody[key],
          disabledPaths,
          true,
        )
      } else {
        jsonBody[key] = recursiveParseBody(
          `${dataPath}.${key}`,
          dataSection,
          jsonBody[key],
          disabledPaths,
          false,
        )
      }
    }
  } else if (dataType === DataType.ARRAY) {
    ;(jsonBody as any[]).forEach((item, idx) => {
      jsonBody[idx] = recursiveParseBody(
        dataPath,
        dataSection,
        item,
        disabledPaths,
        redacted,
      )
    })
  } else {
    if (redacted) {
      return "[REDACTED]"
    }
    return jsonBody
  }
  return jsonBody
}

const redactBlockedFieldsBodyData = (
  body: string,
  dataSection: string,
  disabledPaths: string[],
) => {
  if (!body) {
    return
  }
  let redacted = false
  if (isContained(disabledPaths, dataSection)) {
    redacted = true
  }

  let jsonBody = parsedJson(body)
  if (jsonBody) {
    const dataType = getDataType(jsonBody)
    if (dataType === DataType.OBJECT) {
      for (let key in jsonBody) {
        const contained = isContained(disabledPaths, `${dataSection}.${key}`)
        if (redacted || contained || isSensitiveDataKey(key)) {
          jsonBody[key] = recursiveParseBody(
            key,
            dataSection,
            jsonBody[key],
            disabledPaths,
            true,
          )
        } else {
          jsonBody[key] = recursiveParseBody(
            key,
            dataSection,
            jsonBody[key],
            disabledPaths,
            false,
          )
        }
      }
    } else if (dataType === DataType.ARRAY) {
      ;(jsonBody as any[]).forEach((item, idx) => {
        jsonBody[idx] = recursiveParseBody(
          "",
          dataSection,
          item,
          disabledPaths,
          redacted,
        )
      })
    }
  } else {
    if (redacted) {
      body = "[REDACTED]"
    }
  }
  return jsonBody ?? body
}

const redactBlockedFieldsPairObject = (
  data: PairObject[],
  dataSection: string,
  disabledPaths: string[],
): PairObject[] => {
  if (!data) {
    return data
  }
  let redacted = false
  if (isContained(disabledPaths, dataSection)) {
    redacted = true
  }
  return data.map(item => {
    const contained = isContained(disabledPaths, `${dataSection}.${item.name}`)

    return {
      name: item.name,
      value: recursiveParseBody(
        item.name,
        dataSection,
        parsedJsonNonNull(item.value, true),
        disabledPaths,
        redacted || contained || isSensitiveDataKey(item.name),
      ),
    }
  })
}

export const redactBlockedFields = async (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
) => {
  const res = await getDisabledPaths(ctx, apiTrace)
  const disabledPaths = res ?? {
    reqQuery: [],
    reqHeaders: [],
    reqBody: [],
    resHeaders: [],
    resBody: [],
  }

  const validRequestParams = redactBlockedFieldsPairObject(
    apiTrace.requestParameters,
    "req.query",
    disabledPaths.reqQuery,
  )
  const validRequestHeaders = redactBlockedFieldsPairObject(
    apiTrace.requestHeaders,
    "req.headers",
    disabledPaths.reqHeaders,
  )
  const validRequestBody = redactBlockedFieldsBodyData(
    apiTrace.requestBody,
    "req.body",
    disabledPaths.reqBody,
  )
  const validResponseHeaders = redactBlockedFieldsPairObject(
    apiTrace.responseHeaders,
    "res.headers",
    disabledPaths.resHeaders,
  )
  const validResponseBody = redactBlockedFieldsBodyData(
    apiTrace.responseBody,
    "res.body",
    disabledPaths.resBody,
  )

  apiTrace.requestParameters = validRequestParams
  apiTrace.requestHeaders = validRequestHeaders
  apiTrace.requestBody = validRequestBody
  apiTrace.responseHeaders = validResponseHeaders
  apiTrace.responseBody = validResponseBody
}
