import { JSONSchemaFaker } from "json-schema-faker"
import { DataType } from "./enums"
import { KeyValType } from "../types/test"
import { AuthType, DataSection } from "./enums"
import {
  GeneratedTestRequest,
  GenTestContext,
  GenTestEndpoint,
  GenTestEndpointDataField,
} from "./types"

const getSampleSchemaData = (schema: any) => {
  if (!schema) {
    return null
  }
  try {
    JSONSchemaFaker.option({ alwaysFakeOptionals: true })
    return JSONSchemaFaker.generate(schema)
  } catch {
    return null
  }
}

const generateRequestBodyFromSpec = (operationObject: any) => {
  const requestBody = operationObject?.requestBody
  const requestContentTypes = requestBody?.content
  let sample = null
  let contentType = null
  if (requestContentTypes) {
    contentType = Object.keys(requestContentTypes)[0]
    if (contentType && requestContentTypes[contentType]?.schema) {
      sample = getSampleSchemaData(requestContentTypes[contentType].schema)
    }
  }
  return { sample, contentType }
}

const getSpecOperationObject = (endpoint: GenTestEndpoint) => {
  const parsedSpec = endpoint.spec
  const pathString = parsedSpec?.["paths"]?.[endpoint.path]
    ? endpoint.path
    : endpoint.path + "/"
  const operationObject =
    parsedSpec?.["paths"]?.[pathString]?.[endpoint.method?.toLowerCase()]
  return operationObject
}

const getSpecParameters = (endpoint: GenTestEndpoint) => {
  const parsedSpec = endpoint.spec
  const pathString = parsedSpec?.["paths"]?.[endpoint.path]
    ? endpoint.path
    : endpoint.path + "/"
  let parameters =
    parsedSpec?.["paths"]?.[pathString]?.[endpoint.method?.toLowerCase()]
      ?.parameters ?? parsedSpec?.["paths"]?.[pathString]?.parameters
  return parameters ?? []
}

const getSampleValue = (dataType: DataType) => {
  switch (dataType) {
    case DataType.BOOLEAN:
      return true
    case DataType.INTEGER:
      return Math.floor(Math.random() * (100 - 1 + 1)) + 1
    case DataType.NUMBER:
      return Number((Math.random() * (1.0 - 100.0) + 100.0).toFixed(3))
    case DataType.STRING:
      return Math.random().toString(36).slice(2)
    default:
      return null
  }
}

export const addAuthToRequest = (
  gen: GeneratedTestRequest,
  ctx: GenTestContext,
): GeneratedTestRequest => {
  const authConfig = ctx.endpoint.authConfig
  if (!authConfig) {
    return gen
  }
  let env: KeyValType[] = []
  let headers: KeyValType[] = []
  const pre = ctx.prefix ? ctx.prefix + "_" : ""
  if (authConfig.authType == AuthType.BASIC) {
    headers = headers.concat({
      name: "Authorization",
      value: `Basic {{${pre}BASIC_AUTH_CRED}}`,
    })
    env.push({
      name: `${pre}BASIC_AUTH_CRED`,
      value: `{{global.${pre}BASIC_AUTH_CRED}}`,
    })
  } else if (authConfig.authType == AuthType.HEADER) {
    headers = headers.concat({
      name: authConfig.headerKey,
      value: `{{${pre}CREDENTIALS}}`,
    })
    env.push({
      name: `${pre}CREDENTIALS`,
      value: `{{global.${pre}CREDENTIALS}}`,
    })
  } else if (authConfig.authType == AuthType.JWT) {
    headers = headers.concat({
      name: authConfig.headerKey,
      value: `{{${pre}JWT}}`,
    })
    env.push({
      name: `${pre}JWT`,
      value: `{{global.${pre}JWT}}`,
    })
  }
  return {
    ...gen,
    req: {
      ...gen.req,
      headers: (gen.req.headers || []).concat(headers),
    },
    env: gen.env.concat(env),
  }
}

const recurseCreateBody = (
  body: any,
  arrayFieldDepth: number,
  mapTokens: string[],
  currTokenIndex: number,
  dataField: GenTestEndpointDataField,
): any => {
  if (
    arrayFieldDepth === 0 &&
    (currTokenIndex > mapTokens.length - 1 || !mapTokens[currTokenIndex])
  ) {
    return getSampleValue(dataField.dataType)
  } else if (arrayFieldDepth > 0) {
    return [
      recurseCreateBody(
        body?.[0],
        arrayFieldDepth - 1,
        mapTokens,
        currTokenIndex,
        dataField,
      ),
    ]
  } else {
    const currToken = mapTokens?.[currTokenIndex]
    const currPath = mapTokens.slice(0, currTokenIndex + 1).join(".")
    const tmpArrayFieldDepth = dataField.arrayFields?.[currPath]
    if (tmpArrayFieldDepth) {
      return {
        ...body,
        [currToken]: [
          recurseCreateBody(
            body?.[currToken]?.[0],
            tmpArrayFieldDepth - 1,
            mapTokens,
            currTokenIndex + 1,
            dataField,
          ),
        ],
      }
    } else {
      return {
        ...body,
        [currToken]: recurseCreateBody(
          body?.[currToken],
          0,
          mapTokens,
          currTokenIndex + 1,
          dataField,
        ),
      }
    }
  }
}

const getRecentTraceHash = (traceHash: Record<string, number>) => {
  let res: { hash: string | null; timestamp: number | null } = {
    hash: null,
    timestamp: null,
  }
  for (const hash in traceHash) {
    if (!res.timestamp || traceHash[hash] > res.timestamp) {
      res.hash = hash
      res.timestamp = traceHash[hash]
    }
  }
  return res
}

const getDataFieldInfo = (dataFields: GenTestEndpointDataField[]) => {
  let contentType = dataFields[0].contentType
  let traceHash = getRecentTraceHash(dataFields[0].traceHash)

  for (const dataField of dataFields) {
    const currTraceHash = getRecentTraceHash(dataField.traceHash)
    if (
      dataField.contentType &&
      currTraceHash?.timestamp &&
      traceHash?.timestamp &&
      currTraceHash?.timestamp > traceHash?.timestamp
    ) {
      traceHash = { ...currTraceHash }
      contentType = dataField.contentType
    }
  }
  return { contentType, traceHash }
}

const addBodyToRequest = (
  gen: GeneratedTestRequest,
  dataFields: GenTestEndpointDataField[],
  specOperationObject?: any,
): GeneratedTestRequest => {
  let body: any = undefined
  let contentType: string | null = null
  if (specOperationObject) {
    const specData = generateRequestBodyFromSpec(specOperationObject)
    body = specData?.sample
    contentType = specData?.contentType
  } else {
    const bodyDataFields = dataFields.filter(
      e => e.dataSection == DataSection.REQUEST_BODY && e.contentType,
    )
    if (bodyDataFields.length == 0) {
      return gen
    }
    const dataFieldInfo = getDataFieldInfo(bodyDataFields)
    contentType = dataFieldInfo?.contentType
    const traceHash = dataFieldInfo?.traceHash
    const filteredDataFields = bodyDataFields.filter(
      e =>
        e.contentType == contentType &&
        traceHash.hash &&
        e.traceHash[traceHash.hash],
    )
    if (filteredDataFields.length === 0) {
      return gen
    }
    for (const dataField of filteredDataFields) {
      const mapTokens = dataField.dataPath?.split(".")
      const rootArrayDepth = dataField.arrayFields?.[""]
      if (rootArrayDepth > 0) {
        body = recurseCreateBody(body, rootArrayDepth, mapTokens, 0, dataField)
      } else {
        body = recurseCreateBody(body, 0, mapTokens, 0, dataField)
      }
    }
  }
  if (contentType === null && body === null) {
    return gen
  }
  if (contentType?.includes("form")) {
    return {
      ...gen,
      req: {
        ...gen.req,
        headers: (gen.req.headers || []).concat({
          name: "Content-Type",
          value: contentType,
        }),
        form: Object.entries(body).map(([key, val]) => ({
          name: key,
          value: val as string,
        })),
      },
    }
  } else if (
    contentType?.includes("json") ||
    contentType == "*/*" ||
    typeof body == "object"
  ) {
    return {
      ...gen,
      req: {
        ...gen.req,
        headers: (gen.req.headers || []).concat({
          name: "Content-Type",
          value: "application/json",
        }),
        data: JSON.stringify(body, null, 4),
      },
    }
  } else if (contentType && typeof body == "string") {
    return {
      ...gen,
      req: {
        ...gen.req,
        headers: (gen.req.headers || []).concat({
          name: "Content-Type",
          value: contentType,
        }),
        data: body,
      },
    }
  }
  return gen
}

const addQueryParamsToRequest = (
  gen: GeneratedTestRequest,
  ctx: GenTestContext,
  specParameters?: any,
): GeneratedTestRequest => {
  const pre = ctx.prefix
  let queryParams: KeyValType[] = []
  let env: KeyValType[] = []
  if (specParameters) {
    let added = false
    for (const parameter of specParameters) {
      if (parameter?.in === "query") {
        added = true
        const name = parameter.name
        env.push({
          name: `${pre}${name}`,
          value: `<<${pre}${name}>>`,
        })
        queryParams.push({
          name: name,
          value: `{{${pre}${name}}}`,
        })
      }
    }
    if (!added) {
      return gen
    }
  } else {
    const endpoint = ctx.endpoint
    const dataFields = endpoint.dataFields.filter(
      e => e.dataSection == DataSection.REQUEST_QUERY,
    )
    if (dataFields.length == 0) {
      return gen
    }
    dataFields.forEach(e => {
      const name = e.dataPath
      env.push({
        name: `${pre}${name}`,
        value: `<<${pre}${name}>>`,
      })
      queryParams.push({
        name: e.dataPath,
        value: `{{${pre}${name}}}`,
      })
    })
  }
  return {
    ...gen,
    env: gen.env.concat(env),
    req: {
      ...gen.req,
      query: (gen.req.query || []).concat(queryParams),
    },
  }
}

export const makeSampleRequestNoAuth = (
  endpoint: GenTestEndpoint,
  name?: string,
): GeneratedTestRequest => {
  const prefix = name ? name + "_" : ""
  let env: KeyValType[] = []
  const paramRegex = new RegExp("{([^{}]+)}", "g")
  const params = endpoint.path.matchAll(paramRegex)
  for (const param of params) {
    env.push({
      name: `${prefix}${param[1]}`,
      value: `<<${prefix}${param[1]}>>`,
    })
  }
  env.push({
    name: "BASE_URL",
    value: `{{default BASE_URL "https://${endpoint.host}"}}`,
  })
  const replacedPath = endpoint.path.replace(paramRegex, `{{${prefix}$1}}`)
  let gen: GeneratedTestRequest = {
    req: {
      method: endpoint.method,
      url: `{{BASE_URL}}${replacedPath}`,
    },
    env,
  }
  const ctx: GenTestContext = { endpoint, prefix }
  let specOperationObject = null
  let specParameters = null
  if (endpoint.spec) {
    specOperationObject = getSpecOperationObject(endpoint)
    specParameters = getSpecParameters(endpoint)
  }
  gen = addQueryParamsToRequest(gen, ctx, specParameters)
  gen = addBodyToRequest(gen, endpoint.dataFields, specOperationObject)
  return gen
}

export const makeSampleRequest = (
  endpoint: GenTestEndpoint,
  name?: string,
): GeneratedTestRequest => {
  const ctx: GenTestContext = { endpoint, prefix: name }
  let gen = makeSampleRequestNoAuth(endpoint, name)
  gen = addAuthToRequest(gen, ctx)
  return gen
}
