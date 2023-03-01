import { DataType } from "./enums"
import { KeyValType } from "../types/test"
import { DataSection } from "./enums"
import {
  GeneratedTestRequest,
  GenTestContext,
  GenTestEndpoint,
  GenTestEndpointDataField,
} from "./types"
import { AuthType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getEntityMap } from "./permissions"

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
  entityMap: Record<string, any>,
): any => {
  if (
    arrayFieldDepth === 0 &&
    (currTokenIndex > mapTokens.length - 1 || !mapTokens[currTokenIndex])
  ) {
    return dataField.entity && entityMap[dataField.entity]
      ? entityMap[dataField.entity]
      : getSampleValue(dataField.dataType)
  } else if (arrayFieldDepth > 0) {
    return [
      recurseCreateBody(
        body?.[0],
        arrayFieldDepth - 1,
        mapTokens,
        currTokenIndex,
        dataField,
        entityMap,
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
            entityMap,
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
          entityMap,
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
  ctx: GenTestContext,
): GeneratedTestRequest => {
  const endpoint = ctx.endpoint
  const dataFields = endpoint.dataFields.filter(
    e => e.dataSection == DataSection.REQUEST_BODY && e.contentType,
  )
  if (dataFields.length == 0) {
    return gen
  }
  const { contentType, traceHash } = getDataFieldInfo(dataFields)
  const filteredDataFields = dataFields.filter(
    e =>
      e.contentType == contentType &&
      traceHash.hash &&
      e.traceHash[traceHash.hash],
  )
  if (filteredDataFields.length === 0) {
    return gen
  }
  let body: any = undefined
  for (const dataField of filteredDataFields) {
    const mapTokens = dataField.dataPath?.split(".")
    const rootArrayDepth = dataField.arrayFields?.[""]
    if (rootArrayDepth > 0) {
      body = recurseCreateBody(
        body,
        rootArrayDepth,
        mapTokens,
        0,
        dataField,
        ctx.entityMap,
      )
    } else {
      body = recurseCreateBody(body, 0, mapTokens, 0, dataField, ctx.entityMap)
    }
  }
  if (contentType.includes("form")) {
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
    contentType.includes("json") ||
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
  } else if (typeof body == "string") {
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
): GeneratedTestRequest => {
  const endpoint = ctx.endpoint
  const dataFields = endpoint.dataFields.filter(
    e => e.dataSection == DataSection.REQUEST_QUERY,
  )
  if (dataFields.length == 0) {
    return gen
  }
  const pre = ctx.prefix
  let queryParams: KeyValType[] = []
  let env: KeyValType[] = []
  for (const queryField of dataFields) {
    if (queryField.entity && ctx.entityMap[queryField.entity]) {
      queryParams.push({
        name: queryField.dataPath,
        value: ctx.entityMap[queryField.entity],
      })
    } else {
      const name = queryField.dataPath
      env.push({
        name: `${pre}${name}`,
        value: `<<${pre}${name}>>`,
      })
      queryParams.push({
        name: queryField.dataPath,
        value: `{{${pre}${name}}}`,
      })
    }
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

export const makeSampleRequestNoAuthInner = (
  ctx: GenTestContext,
): GeneratedTestRequest => {
  let env: KeyValType[] = []
  ctx.prefix = ctx.prefix ? ctx.prefix + "_" : ""

  let replacedPath = ctx.endpoint.path
  for (const paramField of ctx.endpoint.dataFields.filter(
    e => e.dataSection == DataSection.REQUEST_PATH,
  )) {
    if (paramField.entity && ctx.entityMap[paramField.entity]) {
      replacedPath = replacedPath.replace(
        `{${paramField.dataPath}}`,
        `${ctx.entityMap[paramField.entity]}`,
      )
    } else {
      env.push({
        name: `${ctx.prefix}${paramField.dataPath}`,
        value: `<<${ctx.prefix}${paramField.dataPath}>>`,
      })
      replacedPath = replacedPath.replace(
        `{${paramField.dataPath}}`,
        `{{${ctx.prefix}${paramField.dataPath}}}`,
      )
    }
  }

  env.push({
    name: "BASE_URL",
    value: `{{default BASE_URL "https://${ctx.endpoint.host}"}}`,
  })
  let gen: GeneratedTestRequest = {
    req: {
      method: ctx.endpoint.method,
      url: `{{BASE_URL}}${replacedPath}`,
    },
    env,
  }
  if (ctx.reason) {
    gen.req.description = ctx.reason
  }
  gen = addQueryParamsToRequest(gen, ctx)
  gen = addBodyToRequest(gen, ctx)
  return gen
}

export const makeSampleRequestNoAuth = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
  name?: string,
): GeneratedTestRequest => {
  const entityMap = getEntityMap(endpoint, config)
  const ctx = {
    endpoint,
    prefix: name,
    entityMap,
  }
  return makeSampleRequestNoAuthInner(ctx)
}

export const makeSampleRequest = (
  endpoint: GenTestEndpoint,
  config: TemplateConfig,
  name?: string,
): GeneratedTestRequest => {
  const ctx: GenTestContext = {
    endpoint,
    prefix: name,
    entityMap: {},
  }
  let gen = makeSampleRequestNoAuth(endpoint, config, name)
  gen = addAuthToRequest(gen, ctx)
  return gen
}
