import { ErrorObject } from "ajv/dist/2019"
import { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from "openapi-types"
import OpenAPISchemaValidator from "openapi-schema-validator"
import { ApiEndpoint, DataField } from "models"
import { getDataType, getValidPath } from "utils"
import { DataSection, DataType } from "@common/enums"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"
import { getPathTokens } from "@common/utils"
import Error400BadRequest from "errors/error-400-bad-request"

export interface VariableObject {
  enum?: string[]
  default: string
  description?: string
}

export interface ServerObject {
  url: string
  description?: string
  variables?: Record<string, VariableObject>
}

export interface SpecValue {
  path: string[]
  value: any
}

interface Parameter {
  name: string
  in: Location
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
}

enum Location {
  QUERY = "query",
  PATH = "path",
  HEADERS = "headers",
  BODY = "body",
}

const LOCATION_TO_DATA_SECTION_LABEL: Record<Location, string> = {
  [Location.QUERY]: "req.query",
  [Location.HEADERS]: "req.headers",
  [Location.BODY]: "req.body",
  [Location.PATH]: "",
}

export type AjvError = ErrorObject<string, Record<string, any>, unknown>

export const getOpenAPISpecVersion = (specObject: any): number | null => {
  if (specObject["swagger"]) {
    return 2
  } else if (specObject["openapi"]) {
    const version = specObject["openapi"]
    if (typeof version === "string" && version.trim().startsWith("3.1")) {
      return 3.1
    } else {
      return 3
    }
  }
  return null
}

const getPathToRequestLocation = (
  parameters: Parameter[],
  location: Location,
  field: string,
) => {
  if (parameters?.length > 0 && location !== Location.BODY) {
    for (let i = 0; i < parameters.length; i++) {
      const parameter = parameters[i]
      if (parameter.in === location && parameter.name === field) {
        return [`${i}`, "name"]
      }
    }
  }
  return []
}

export const parsePathParameter = (parameterValue: string) => {
  return typeof parameterValue === "number"
    ? Number(parameterValue)
    : parameterValue
}

export const validateSpecSchema = (schema: any, version?: number): string[] => {
  if (!schema) {
    return ["No schema defined in OpenAPI spec"]
  }
  const res: string[] = []
  const schemaValidator = new OpenAPISchemaValidator({
    version: version ?? 3,
  })
  const errors = schemaValidator.validate(schema ?? ({} as any)).errors
  for (let i = 0; i < errors.length; i++) {
    const error = errors[i]
    const defaultErrorMessage =
      error.message[0].toUpperCase() + error.message.slice(1)
    const field = error.instancePath
      .replace(/\//g, ".")
      .replace(/~1/g, "/")
      .slice(1)
    let message = ""
    switch (error.keyword) {
      case "required":
        message = `Required property '${
          error.params?.["missingProperty"]
        }' is missing${field ? ` from ${field}` : ""}.`
        break
      case "additionalProperties":
        message = `Must not have additional property '${
          error.params?.["additionalProperty"]
        }'${field ? ` for ${field}` : ""}.`
        break
      default:
        message = `${defaultErrorMessage}${field ? ` for '${field}'` : ""}.`
    }
    res.push(message)
  }
  return res
}

export const generateAlertMessageFromReqErrors = (
  errors: AjvError[],
  pathToParameters: string[],
  pathToRequestBody: string[],
  parameters: Parameter[],
  disabledPaths: string[],
): Record<string, string[]> => {
  const res = {}
  if (!errors) {
    return res
  }
  errors?.forEach(error => {
    const basePath =
      error["location"] === Location.BODY ? pathToRequestBody : pathToParameters
    let pathArray = error.instancePath?.split("/")?.slice(2)
    const message = error.message
    const defaultErrorMessage =
      message[0].toUpperCase() +
      message.slice(
        1,
        message[message.length - 1] === "." ? -1 : message.length,
      )
    let errorMessage = `${defaultErrorMessage} in request${
      error["location"] ? ` ${error["location"]}` : ""
    }.`
    let path = pathArray?.length > 0 ? pathArray.join(".") : ""
    let ignoreError = false
    const isDisabledPath = disabledPaths.includes(
      `${LOCATION_TO_DATA_SECTION_LABEL[error["location"]]}.${path}`,
    )
    switch (error.keyword) {
      case "required":
        if (error.params?.missingProperty) {
          path = path
            ? `${path}.${error.params.missingProperty}`
            : error.params.missingProperty
        }
        errorMessage = `Required property '${path}' is missing from request ${error["location"]}.`
        break
      case "type":
        if (isDisabledPath) {
          ignoreError = true
        }
        errorMessage = `Property '${path}' ${error.message} in request ${error["location"]}.`
        break
      case "additionalProperties":
        if (error.params?.additionalProperty) {
          path = path
            ? `${path}.${error.params.additionalProperty}`
            : error.params.additionalProperty
        }
        errorMessage =
          path &&
          `Property '${path}' is present in request ${error["location"]} without matching any schemas/definitions in the OpenAPI Spec.`
        break
      case "unevaluatedProperties":
        if (error.params?.unevaluatedProperty) {
          path = path
            ? `${path}.${error.params.unevaluatedProperty}`
            : error.params.unevaluatedProperty
        }
        errorMessage =
          path &&
          `Property '${path}' is present in request ${error["location"]} without matching any schemas/definitions in the OpenAPI Spec.`
        break
      case "format":
        if (isDisabledPath) {
          ignoreError = true
        }
        errorMessage = `Property '${path}' ${error.message} in request ${error["location"]}.`
        break
      default:
        errorMessage = `${defaultErrorMessage}: '${path}' in request ${error["location"]}.`
        break
    }
    if (!path) {
      errorMessage = `${defaultErrorMessage} in request ${error["location"]}.`
    }
    if (!error["location"]) {
      errorMessage = `${defaultErrorMessage} in request.`
    }
    const errorField = path?.split(".")[0]
    const tempPath = getPathToRequestLocation(
      parameters,
      error["location"] as Location,
      errorField,
    )

    if (!ignoreError) {
      res[errorMessage] = [...basePath, ...tempPath]
    }
  })
  return res
}

export const generateAlertMessageFromRespErrors = (
  errors: AjvError[],
  pathToResponseBody: string[],
  disabledPaths: string[],
): Record<string, string[]> => {
  const res = {}
  if (!errors) {
    return res
  }
  errors?.forEach(error => {
    let pathArray = error.instancePath?.split("/")?.slice(2)
    const message = error.message
    const defaultErrorMessage =
      message[0].toUpperCase() +
      message.slice(
        1,
        message[message.length - 1] === "." ? -1 : message.length,
      )
    let errorMessage = `${defaultErrorMessage} in response body.`
    let path = pathArray?.length > 0 ? pathArray.join(".") : ""
    let typeError = false
    switch (error.keyword) {
      case "required":
        if (error.params?.missingProperty) {
          path = path
            ? `${path}.${error.params.missingProperty}`
            : error.params.missingProperty
        }
        errorMessage = `Required property '${path}' is missing from response body.`
        break
      case "type":
        typeError = true
        errorMessage = `Property '${path}' ${error.message} in response body.`
        break
      case "additionalProperties":
        if (error.params?.additionalProperty) {
          path = path
            ? `${path}.${error.params.additionalProperty}`
            : error.params.additionalProperty
        }
        errorMessage =
          path &&
          `Property '${path}' is present in response body without matching any schemas/definitions in the OpenAPI Spec.`
        break
      case "unevaluatedProperties":
        if (error.params?.unevaluatedProperty) {
          path = path
            ? `${path}.${error.params.unevaluatedProperty}`
            : error.params.unevaluatedProperty
        }
        errorMessage =
          path &&
          `Property '${path}' is present in response body without matching any schemas/definitions in the OpenAPI Spec.`
        break
      case "format":
        typeError = true
        errorMessage = `Property '${path}' ${error.message} in response body.`
        break
      default:
        errorMessage = `${defaultErrorMessage}: '${path}' in response body.`
        break
    }
    if (!path) {
      errorMessage = `${defaultErrorMessage} in response body.`
    }

    let pathIncludesToken = true
    if (typeError && disabledPaths.length > 0) {
      for (const disabledPath of disabledPaths) {
        const splitPath = disabledPath.split(".")
        const nonSectionSplitPath = splitPath.slice(2, splitPath.length)
        for (const token of nonSectionSplitPath) {
          if (!path.includes(token)) {
            pathIncludesToken = false
            break
          }
        }
        if (!pathIncludesToken) {
          break
        }
      }
    } else if (typeError) {
      pathIncludesToken = false
    }

    if (!typeError || (typeError && !pathIncludesToken)) {
      res[errorMessage] = pathToResponseBody
    }
  })
  return res
}

export const getSpecRequestParameters = (
  specObject: OpenAPI.Document,
  endpoint: ApiEndpoint,
  pathString: string,
): SpecValue => {
  const paths = specObject?.["paths"]
  const path = paths?.[pathString]
  const operation = path?.[endpoint.method.toLowerCase()]

  let parameters = operation?.["parameters"] ?? []
  let pathToParameters = [
    "paths",
    pathString,
    endpoint.method.toLowerCase(),
    "parameters",
  ]
  if (!parameters) {
    parameters = path?.["parameters"]
    pathToParameters = ["paths", pathString, "parameters"]
    if (!parameters) {
      parameters = specObject?.["components"]?.["parameters"]
      pathToParameters = parameters ? ["components", "parameters"] : []
    }
  }
  return { path: pathToParameters ?? [], value: parameters ?? [] }
}

export const recursiveTransformSpec = (schema: any) => {
  const combineKeywords = ["anyOf", "allOf", "oneOf"]
  for (const keyword of combineKeywords) {
    if (schema[keyword]) {
      if (!schema["unevaluatedProperties"])
        schema["unevaluatedProperties"] = false
      for (let i = 0; i < schema[keyword]?.length; i++) {
        if (schema[keyword][i]) {
          const properties = schema[keyword][i]["properties"]
          if (properties && getDataType(properties) === DataType.OBJECT) {
            for (const property in properties) {
              recursiveTransformSpec(schema[keyword][i]["properties"][property])
            }
          }
        }
      }
    }
  }
  const isPropertyObject = typeof schema["properties"] === "object"
  const isItemsObject = typeof schema["items"] === "object"
  if (schema["type"] === "object" || isPropertyObject) {
    if (!schema["additionalProperties"]) schema["additionalProperties"] = false
    const properties = schema["properties"]
    if (properties && isPropertyObject) {
      for (const property in properties) {
        recursiveTransformSpec(schema["properties"][property])
      }
    }
  } else if (schema["type"] === "array" || isItemsObject) {
    const items = schema["items"]
    if (items && isItemsObject) {
      recursiveTransformSpec(schema["items"])
    }
  }
}

export const getSpecResponses = (
  specObject: OpenAPI.Document,
  endpoint: ApiEndpoint,
  pathString: string,
): SpecValue => {
  const operation =
    specObject["paths"]?.[pathString]?.[endpoint.method.toLowerCase()]

  let responses = operation["responses"] ?? []
  let pathToResponses = [
    "paths",
    pathString,
    endpoint.method.toLowerCase(),
    "responses",
  ]
  if (!responses) {
    responses = specObject["components"]["responses"]
    pathToResponses = responses ? ["components", "responses"] : []
  }
  if (responses) {
    for (const responseStatus in responses) {
      const content = responses[responseStatus]["content"]
      if (content) {
        for (const contentType in content) {
          const schema = content[contentType]["schema"]
          if (schema) {
            recursiveTransformSpec(schema)
          }
        }
      }
    }
  }
  return { path: pathToResponses ?? [], value: responses ?? {} }
}

export const getSpecRequestBody = (
  specObject: OpenAPI.Document,
  endpoint: ApiEndpoint,
  pathString: string,
): SpecValue => {
  const operation =
    specObject?.paths?.[pathString]?.[endpoint.method.toLowerCase()]

  let requestBody = operation?.["requestBody"]
  let pathToRequestBody = null

  if (requestBody) {
    const content = requestBody["content"]
    pathToRequestBody = [
      "paths",
      pathString,
      endpoint.method.toLowerCase(),
      "requestBody",
    ]
    if (content) {
      for (const contentType in content) {
        const schema = content?.[contentType]?.["schema"]
        if (schema) {
          recursiveTransformSpec(schema)
        }
      }
    }
  }
  return { path: pathToRequestBody ?? [], value: requestBody ?? {} }
}

export const getSpecPathString = (specObject: any, endpointPath: string) => {
  const pathTokens = getPathTokens(endpointPath)
  const len = pathTokens.length
  for (let i = 0; i < len; i++) {
    let currPath = pathTokens.slice(i, len).join("/")
    if (currPath !== "/") {
      currPath = "/" + currPath
    }
    const pathString = specObject?.["paths"]?.[currPath]
      ? currPath
      : specObject?.["paths"]?.[currPath + "/"]
      ? currPath + "/"
      : null
    if (pathString) {
      return pathString
    }
  }
  return null
}

export const getHostFromServer = (
  server: ServerObject,
): Record<string, Set<string>> => {
  let hosts: Set<string> = new Set()
  const url = server.url
  if (url) {
    const serverVariables = server.variables
    let prevHosts: string[] = [url]
    let currHosts: string[] = []
    if (serverVariables) {
      for (const variableName in serverVariables) {
        currHosts = []
        const variable = serverVariables[variableName]
        for (const prevUrl of prevHosts) {
          if (variable.enum) {
            for (const enumValue of variable.enum) {
              const host = prevUrl.replace(
                new RegExp(String.raw`{${variableName}}`, "g"),
                enumValue,
              )
              currHosts.push(host)
            }
          } else if (variable.default) {
            const host = prevUrl.replace(
              new RegExp(String.raw`{${variableName}}`, "g"),
              variable.default,
            )
            currHosts.push(host)
          }
        }
        prevHosts = currHosts
      }
      hosts = new Set(prevHosts)
    } else {
      hosts = new Set([url])
    }
  }
  const parsedHosts: Record<string, Set<string>> = {}
  for (const host of hosts) {
    try {
      const urlObj = new URL(host)
      const urlHost = urlObj.host
      const urlPath = urlObj.pathname
      const validUrlPath = getValidPath(urlPath)
      if (!validUrlPath.isValid) {
        throw new Error(
          `Provided server url in OpenAPI Spec has invalid path: ${host}`,
        )
      }
      if (!parsedHosts[urlHost]) {
        parsedHosts[urlHost] = new Set(
          validUrlPath.path.length > 1 ? [urlPath] : [],
        )
      } else if (validUrlPath.path.length > 1) {
        parsedHosts[urlHost].add(validUrlPath.path)
      }
    } catch (err) {
      throw new Error(
        `Provided server url in OpenAPI Spec is not a valid url: ${host}`,
      )
    }
  }
  return parsedHosts
}

export const getServersV3 = (
  specObject: any,
  path: string,
  method: string,
): ServerObject[] => {
  return (
    specObject?.["paths"]?.[path]?.[method]?.["servers"] ??
    specObject?.["paths"]?.[path]?.["servers"] ??
    specObject?.["servers"] ??
    []
  )
}

export const getHostsV3 = (
  servers: ServerObject[],
): Record<string, Set<string>> => {
  let hosts: Record<string, Set<string>> = {}
  for (const server of servers) {
    const currServerHosts = getHostFromServer(server)
    hosts = { ...hosts, ...currServerHosts }
  }
  return hosts
}

export const getHostsV2 = (specObject: any): Set<string> => {
  const host: string = specObject?.["host"]
  const basePath: string = specObject?.["basePath"]
  const schemes: string[] = specObject?.["schemes"]
  if (!host) {
    throw new Error422UnprocessableEntity("No host found in spec file.")
  }
  const baseHost = `${host}${basePath ?? ""}`.trim()
  let hosts: Set<string> = new Set()
  if (schemes && schemes.length > 0) {
    schemes?.forEach(scheme => hosts.add(`${scheme}://${baseHost}`))
  } else {
    hosts.add(baseHost)
  }
  return hosts
}

export const getParameters = (
  specObject: OpenAPI.Document,
  path: string,
  method: string,
) => {
  return (
    specObject?.["paths"]?.[path]?.[method]?.["parameters"] ??
    specObject?.["paths"]?.[path]?.parameters ??
    []
  )
}

const getParameterDataSection = (location: string) => {
  switch (location) {
    case "path":
      return DataSection.REQUEST_PATH
    case "query":
      return DataSection.REQUEST_QUERY
    case "header":
    case "cookie":
      return DataSection.REQUEST_HEADER
    default:
      throw new Error400BadRequest(
        `Invalid location for parameter: ${location}`,
      )
  }
}

const getSpecDataType = (
  providedType:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "integer"
    | "null"
    | ("array" | OpenAPIV3_1.NonArraySchemaObjectType)[],
) => {
  if (Array.isArray(providedType)) {
    const entry = providedType.find(e => e !== "null")
    if (!entry) {
      return DataType.UNKNOWN
    }
    return entry as DataType
  } else {
    return providedType === "null"
      ? DataType.UNKNOWN
      : (providedType as DataType)
  }
}

const recurseCreateDataFields = (
  dataFields: Record<string, DataField>,
  dataPath: string,
  dataSection: DataSection,
  contentType: string,
  statusCode: number,
  apiEndpointUuid: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
  count: number,
) => {
  if (!schema) {
    return
  }
  if (count > 20) {
    return
  }
  if (schema.oneOf) {
    for (const item of schema.oneOf) {
      recurseCreateDataFields(
        dataFields,
        dataPath,
        dataSection,
        contentType,
        statusCode,
        apiEndpointUuid,
        item as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
        count,
      )
    }
  } else if (schema.anyOf) {
    for (const item of schema.anyOf) {
      recurseCreateDataFields(
        dataFields,
        dataPath,
        dataSection,
        contentType,
        statusCode,
        apiEndpointUuid,
        item as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
        count,
      )
    }
  } else if (schema.allOf) {
    for (const item of schema.allOf) {
      recurseCreateDataFields(
        dataFields,
        dataPath,
        dataSection,
        contentType,
        statusCode,
        apiEndpointUuid,
        item as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
        count,
      )
    }
  } else if (schema["items"]) {
    recurseCreateDataFields(
      dataFields,
      `${dataPath ? `${dataPath}.` : ""}[]`,
      dataSection,
      contentType,
      statusCode,
      apiEndpointUuid,
      schema["items"],
      count + 1,
    )
  } else if (schema["patternProperties"]) {
    const keys = Object.keys(schema["patternProperties"])
    if (keys.length > 0) {
      recurseCreateDataFields(
        dataFields,
        `${dataPath ? `${dataPath}.` : ""}[string]`,
        dataSection,
        contentType,
        statusCode,
        apiEndpointUuid,
        schema["patternProperties"][keys[0]],
        count + 1,
      )
    }
  } else if (schema.properties) {
    for (const property in schema.properties) {
      recurseCreateDataFields(
        dataFields,
        `${dataPath ? `${dataPath}.` : ""}${property}`,
        dataSection,
        contentType,
        statusCode,
        apiEndpointUuid,
        schema.properties[property] as
          | OpenAPIV3.SchemaObject
          | OpenAPIV3_1.SchemaObject,
        count + 1,
      )
    }
  } else if (!schema["$ref"] && schema.type) {
    const key = `${statusCode}_${contentType}_${dataSection}${
      dataPath ? `.${dataPath}` : ""
    }`
    if (!dataFields[key]) {
      const dataField = new DataField()
      dataField.dataSection = dataSection
      dataField.dataPath = dataPath ?? ""
      dataField.statusCode = statusCode
      dataField.contentType = contentType
      dataField.dataType = getSpecDataType(schema.type)
      dataField.isNullable =
        schema["nullable"] ||
        (Array.isArray(schema.type)
          ? schema.type.includes("null")
          : schema.type === "null")
      dataField.apiEndpointUuid = apiEndpointUuid
      dataFields[key] = dataField
    } else {
      const existing = dataFields[key]
      const dataType = getSpecDataType(schema.type)
      if (
        existing.dataType === DataType.UNKNOWN &&
        dataType !== DataType.UNKNOWN
      ) {
        existing.dataType = dataType
      }
      if (
        (existing.isNullable === false && schema["nullable"]) ||
        (Array.isArray(schema.type)
          ? schema.type.includes("null")
          : schema.type === "null")
      ) {
        existing.isNullable = true
      }
      dataFields[key] = existing
    }
  }
}

export const getDataFieldsForParameters = (
  parameters: (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[],
  apiEndpointUuid: string,
): DataField[] => {
  if (!parameters) {
    return []
  }
  const dataFields: Record<string, DataField> = {}
  for (const parameter of parameters) {
    const dataSection = getParameterDataSection(parameter.in)
    let schema = parameter.schema
    if (!schema && parameter.content) {
      const keys = Object.keys(parameter.content)
      if (keys.length > 0) {
        schema = parameter.content[keys[0]].schema
      }
    }
    recurseCreateDataFields(
      dataFields,
      parameter.name,
      dataSection,
      "",
      -1,
      apiEndpointUuid,
      schema as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
      0,
    )
  }
  return Object.values(dataFields)
}

export const getDataFieldsForRequestBody = (
  parsedSpec: OpenAPI.Document,
  path: string,
  method: string,
  apiEndpointUuid: string,
): DataField[] => {
  if (!parsedSpec) {
    return []
  }
  const requestBody = parsedSpec.paths?.[path]?.[
    method as OpenAPIV3.HttpMethods
  ]?.requestBody as OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject
  if (!requestBody) {
    return []
  }

  const dataFields: Record<string, DataField> = {}
  const content = requestBody.content
  for (const mediaType in content) {
    recurseCreateDataFields(
      dataFields,
      null,
      DataSection.REQUEST_BODY,
      mediaType,
      -1,
      apiEndpointUuid,
      content[mediaType].schema as
        | OpenAPIV3.SchemaObject
        | OpenAPIV3_1.SchemaObject,
      0,
    )
  }
  return Object.values(dataFields)
}

export const getDataFieldsForResponse = (
  parsedSpec: OpenAPI.Document,
  path: string,
  method: string,
  apiEndpointUuid: string,
): DataField[] => {
  if (!parsedSpec) {
    return []
  }
  let responses =
    parsedSpec.paths?.[path]?.[method as OpenAPIV3.HttpMethods].responses
  if (!responses) {
    return []
  }

  const dataFields: Record<string, DataField> = {}
  for (const statusCode in responses) {
    const status = statusCode === "default" ? -1 : parseInt(statusCode)
    if (isNaN(status)) {
      throw new Error400BadRequest(
        `Status code in responses object is not a valid integer: ${statusCode}`,
      )
    }
    const statusResponse = responses[statusCode] as
      | OpenAPIV3.ResponseObject
      | OpenAPIV3_1.ResponseObject
    const headers = statusResponse?.headers
    if (headers) {
      for (const header in headers) {
        recurseCreateDataFields(
          dataFields,
          header,
          DataSection.RESPONSE_HEADER,
          "",
          status,
          apiEndpointUuid,
          headers[header]?.["schema"],
          0,
        )
      }
    }
    const content = statusResponse?.content
    if (content) {
      for (const mediaType in content) {
        recurseCreateDataFields(
          dataFields,
          null,
          DataSection.RESPONSE_BODY,
          mediaType,
          status,
          apiEndpointUuid,
          content[mediaType].schema as
            | OpenAPIV3.SchemaObject
            | OpenAPIV3_1.SchemaObject,
          0,
        )
      }
    }
  }
  return Object.values(dataFields)
}
