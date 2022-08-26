import { JSONValue } from "@common/types"
import { OpenAPIRequestValidatorError } from "openapi-request-validator"
import { OpenAPIResponseValidatorError } from "openapi-response-validator"
import { ApiEndpoint } from "models"

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

export const generateAlertMessageFromReqErrors = (
  errors: OpenAPIRequestValidatorError[],
  pathToParameters: string[],
  pathToRequestBody: string[],
  parameters: Parameter[],
): Record<string, string[]> => {
  const res = {}
  if (!errors) {
    return res
  }
  errors?.forEach(error => {
    const errorField = error.path?.split(".")[0]
    const tempPath = getPathToRequestLocation(
      parameters,
      error.location as Location,
      errorField,
    )
    let errorMessage = ""
    const basePath =
      error.location === Location.BODY ? pathToRequestBody : pathToParameters
    if (!error.path) {
      errorMessage = `${error.message} for request ${error.location}`
    } else {
      switch (error.errorCode.split(".")[0]) {
        case "required":
          errorMessage = `Required property '${error.path}' is missing from request ${error.location}`
          break
        case "type":
          errorMessage = `Property '${error.path}' ${error.message} in request ${error.location}`
          break
        case "additionalProperties":
          errorMessage = `Property '${error.path}' is present in request ${error.location} without being defined in OpenAPI Spec`
          break
        case "format":
          errorMessage = `Property '${error.path}' ${error.message} in request ${error.location}`
          break
        default:
          errorMessage = `${error.message}: '${error.path}' in request ${error.location}`
          break
      }
    }
    res[errorMessage] = [...basePath, ...tempPath]
  })
  return res
}

export const generateAlertMessageFromRespErrors = (
  errors: OpenAPIResponseValidatorError[],
  pathToResponseBody: string[],
): Record<string, string[]> => {
  const res = {}
  if (!errors) {
    return res
  }
  errors?.forEach(error => {
    let errorMessage = ""
    switch (error.errorCode.split(".")[0]) {
      case "required":
        errorMessage = `Required property '${error.path}' is missing from response body`
        break
      case "type":
        errorMessage = `Property '${error.path}' ${error.message} in response body`
        break
      case "additionalProperties":
        errorMessage = `Property '${error.path}' is present in response body without being defined in OpenAPI Spec`
        break
      case "format":
        errorMessage = `Property '${error.path}' ${error.message} in response body`
        break
      default:
        errorMessage = `${error.message}: '${error.path}' in response body`
        break
    }
    res[errorMessage] = pathToResponseBody
  })
  return res
}

export const getSpecRequestParameters = (
  specObject: JSONValue,
  endpoint: ApiEndpoint,
): SpecValue => {
  const paths = specObject["paths"]
  const path = paths[endpoint.path]
  const operation = path[endpoint.method.toLowerCase()]

  let parameters = operation["parameters"]
  let pathToParameters = [
    "paths",
    endpoint.path,
    endpoint.method.toLowerCase(),
    "parameters",
  ]
  if (!parameters) {
    parameters = path["parameters"]
    pathToParameters = ["paths", endpoint.path, "parameters"]
    if (!parameters) {
      parameters = specObject["components"]["parameters"]
      pathToParameters = parameters ? ["components", "parameters"] : []
    }
  }
  return { path: pathToParameters ?? [], value: parameters ?? [] }
}

export const getSpecResponses = (
  specObject: JSONValue,
  endpoint: ApiEndpoint,
): SpecValue => {
  const operation =
    specObject["paths"][endpoint.path][endpoint.method.toLowerCase()]

  let responses = operation["responses"]
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
  return { path: pathToResponses ?? [], value: responses ?? [] }
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

export const getHostsFromServer = (servers: ServerObject[]): Set<string> => {
  let hosts: Set<string> = new Set()
  for (const server of servers) {
    const currServerHosts = getHostFromServer(server)
    hosts = new Set([...hosts, ...currServerHosts])
  }
  return hosts
}
