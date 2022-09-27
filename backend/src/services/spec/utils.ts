import { ErrorObject } from "ajv/dist/2019"
import { OpenAPI } from "openapi-types"
import OpenAPISchemaValidator from "openapi-schema-validator"
import { ApiEndpoint } from "models"
import { getDataType } from "utils"
import { DataType } from "@common/enums"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"

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
    return 3
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
  return Number(parameterValue) ?? parameterValue
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
      message[0].toUpperCase() + message.slice(1, message[message.length - 1] === "." ? -1 : message.length)
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
      message[0].toUpperCase() + message.slice(1, message[message.length - 1] === "." ? -1 : message.length)
    let errorMessage = `${defaultErrorMessage} in response body.`
    let path = pathArray?.length > 0 ? pathArray.join(".") : ""
    let ignoreError = false
    const isDisabledPath = disabledPaths.includes(`res.body.${path}`)
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
        if (isDisabledPath) {
          ignoreError = true
        }
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
        if (isDisabledPath) {
          ignoreError = true
        }
        errorMessage = `Property '${path}' ${error.message} in response body.`
        break
      default:
        errorMessage = `${defaultErrorMessage}: '${path}' in response body.`
        break
    }
    if (!path) {
      errorMessage = `${defaultErrorMessage} in response body.`
    }

    if (!ignoreError) {
      res[errorMessage] = pathToResponseBody
    }
  })
  return res
}

export const getSpecRequestParameters = (
  specObject: OpenAPI.Document,
  endpoint: ApiEndpoint,
): SpecValue => {
  const paths = specObject?.["paths"]
  const path = paths?.[endpoint.path]
  const operation = path?.[endpoint.method.toLowerCase()]

  let parameters = operation?.["parameters"] ?? []
  let pathToParameters = [
    "paths",
    endpoint.path,
    endpoint.method.toLowerCase(),
    "parameters",
  ]
  if (!parameters) {
    parameters = path?.["parameters"]
    pathToParameters = ["paths", endpoint.path, "parameters"]
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
    schema["additionalProperties"] = false
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
): SpecValue => {
  const operation =
    specObject["paths"][endpoint.path][endpoint.method.toLowerCase()]

  let responses = operation["responses"] ?? []
  let pathToResponses = [
    "paths",
    endpoint.path,
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
): SpecValue => {
  const operation =
    specObject?.paths?.[endpoint.path]?.[endpoint.method.toLowerCase()]

  let requestBody = operation?.["requestBody"]
  let pathToRequestBody = null

  if (requestBody) {
    const content = requestBody["content"]
    pathToRequestBody = [
      "paths",
      endpoint.path,
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

export const getHostFromServer = (server: ServerObject): Set<string> => {
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
  return hosts
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

export const getHostsV3 = (servers: ServerObject[]): Set<string> => {
  let hosts: Set<string> = new Set()
  for (const server of servers) {
    const currServerHosts = getHostFromServer(server)
    hosts = new Set([...hosts, ...currServerHosts])
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
