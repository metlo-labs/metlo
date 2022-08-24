import { JSONValue } from "@common/types";
import { OpenAPIRequestValidatorError } from "openapi-request-validator";
import { OpenAPIResponseValidatorError } from "openapi-response-validator";
import { ApiEndpoint } from "models";

export interface VariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, VariableObject>;
}

export const generateAlertMessageFromReqErrors = (
  errors: OpenAPIRequestValidatorError[]
): string[] => {
  return (
    errors?.map((error) => {
      switch (error.errorCode.split(".")[0]) {
        case "required":
          return `Required property '${error.path}' is missing from request ${error.location}`;
        case "type":
          return `Property '${error.path}' ${error.message} in request ${error.location}`;
        case "additionalProperties":
          return `Property '${error.path}' is present in request ${error.location} without being defined in OpenAPI Spec`;
        case "format":
          return `Property '${error.path}' ${error.message} in request ${error.location}`;
        default:
          return `${error.message}: '${error.path}' in request ${error.location}`;
      }
    }) || []
  );
};

export const generateAlertMessageFromRespErrors = (
  errors: OpenAPIResponseValidatorError[]
): string[] => {
  return (
    errors?.map((error) => {
      switch (error.errorCode.split(".")[0]) {
        case "required":
          return `Required property '${error.path}' is missing from response body`;
        case "type":
          return `Property '${error.path}' ${error.message} in response body`;
        case "additionalProperties":
          return `Property '${error.path}' is present in response body without being defined in OpenAPI Spec`;
        case "format":
          return `Property '${error.path}' ${error.message} in response body`;
        default:
          return `${error.message}: '${error.path}' in response body`;
      }
    }) || []
  );
};

export const getSpecRequestParameters = (
  specObject: JSONValue,
  endpoint: ApiEndpoint
): any => {
  const paths = specObject["paths"];
  const path = paths[endpoint.path];
  const operation = path[endpoint.method.toLowerCase()];

  let parameters = operation["parameters"];
  if (!parameters) {
    parameters = path["parameters"];
    if (!parameters) {
      parameters = specObject["components"]["parameters"];
    }
  }
  return parameters ?? null;
};

export const getSpecResponses = (
  specObject: JSONValue,
  endpoint: ApiEndpoint
): any => {
  const operation =
    specObject["paths"][endpoint.path][endpoint.method.toLowerCase()];

  let responses = operation["responses"];
  if (!responses) {
    responses = specObject["components"]["responses"];
  }
  return responses ?? null;
};

export const getHostFromServer = (server: ServerObject): Set<string> => {
  let hosts: Set<string> = new Set();
  const url = server.url;
  if (url) {
    const serverVariables = server.variables;
    let prevHosts: string[] = [url];
    let currHosts: string[] = [];
    if (serverVariables) {
      for (const variableName in serverVariables) {
        currHosts = [];
        const variable = serverVariables[variableName];
        for (const prevUrl of prevHosts) {
          if (variable.enum) {
            for (const enumValue of variable.enum) {
              const host = prevUrl.replace(
                new RegExp(String.raw`{${variableName}}`, "g"),
                enumValue
              );
              currHosts.push(host);
            }
          } else if (variable.default) {
            const host = prevUrl.replace(
              new RegExp(String.raw`{${variableName}}`, "g"),
              variable.default
            );
            currHosts.push(host);
          }
        }
        prevHosts = currHosts;
      }
      hosts = new Set(prevHosts);
    } else {
      hosts = new Set([url]);
    }
  }
  return hosts;
};

export const getHostsFromServer = (servers: ServerObject[]): Set<string> => {
  let hosts: Set<string> = new Set();
  for (const server of servers) {
    const currServerHosts = getHostFromServer(server);
    hosts = new Set([...hosts, ...currServerHosts]);
  }
  return hosts;
};
