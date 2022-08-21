import { FindOptionsWhere, IsNull, MoreThan, Raw } from "typeorm";
import {
  getDataType,
  isSuspectedParamater,
  parsedJson,
  parsedJsonNonNull,
} from "utils";
import { ApiEndpoint, ApiTrace, OpenApiSpec } from "models";
import { AppDataSource } from "data-source";
import { AlertType, DataType, RestMethod, SpecExtension } from "@common/enums";
import { ScannerService } from "services/scanner/scan";
import { AlertService } from "services/alert";

interface GenerateEndpoint {
  parameterizedPath: string;
  host: string;
  regex: string;
  method: RestMethod;
  traces: ApiTrace[];
}

enum In {
  QUERY = "query",
  HEADER = "header",
  PATH = "path",
  COOKIE = "cookie",
}

interface BodySchema {
  type?: DataType;
  items?: BodySchema;
  properties?: Record<string, BodySchema>;
}

interface BodyContent {
  [key: string]: { schema?: BodySchema };
}

interface Responses {
  [key: string]: { headers?: BodyContent; content?: BodyContent };
}

export class JobsService {
  static parseSchema(bodySchema: BodySchema, parsedBody: any) {
    const dataType = getDataType(parsedBody);
    if (dataType === DataType.OBJECT) {
      for (let property in parsedBody) {
        bodySchema = {
          type: DataType.OBJECT,
          properties: {
            ...bodySchema?.properties,
            [property]: this.parseSchema(
              bodySchema?.properties?.[property],
              parsedBody[property]
            ),
          },
        };
      }
      return bodySchema;
    } else if (dataType === DataType.ARRAY) {
      bodySchema = {
        type: DataType.ARRAY,
        items: this.parseSchema(bodySchema?.items, parsedBody[0] ?? ""),
      };
      return bodySchema;
    } else {
      return {
        type: getDataType(parsedBody),
      };
    }
  }

  static parseContent(bodySpec: BodyContent, bodyString: string, key: string) {
    const parsedBody = parsedJson(bodyString);
    console.log(bodySpec, bodyString, key);
    let nonNullKey: string;
    if (!parsedBody && bodyString) {
      nonNullKey = key || "text/plain";
      bodySpec[nonNullKey] = {};
    } else if (parsedBody) {
      nonNullKey = key || "application/json";
      if (!bodySpec?.[nonNullKey]) {
        bodySpec[nonNullKey] = { schema: {} };
      }
      bodySpec[nonNullKey] = {
        schema: this.parseSchema(bodySpec[nonNullKey].schema, parsedBody),
      };
    }
  }

  static async generateEndpointsFromTraces(): Promise<void> {
    const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const regexToTracesMap: Record<string, GenerateEndpoint> = {};
    const traces = await apiTraceRepository.findBy({
      apiEndpointUuid: IsNull(),
    });
    if (traces?.length > 0) {
      for (let i = 0; i < traces.length; i++) {
        const trace = traces[i];
        const apiEndpoint = await apiEndpointRepository.findOne({
          where: {
            pathRegex: Raw((alias) => `:path ~ ${alias}`, { path: trace.path }),
            method: trace.method,
            host: trace.host,
          },
          relations: { sensitiveDataClasses: true },
        });
        if (apiEndpoint) {
          apiEndpoint.totalCalls += 1;
          // Check for sensitive data
          await ScannerService.findAllMatchedDataClasses(trace, apiEndpoint);
          trace.apiEndpointUuid = apiEndpoint.uuid;
          await apiEndpointRepository.save(apiEndpoint);
          await apiTraceRepository.save(trace);
        } else {
          let found = false;
          const regexes = Object.keys(regexToTracesMap);
          for (let x = 0; x < regexes.length && !found; x++) {
            const regex = regexes[x];
            if (
              RegExp(regex).test(`${trace.host}-${trace.method}-${trace.path}`)
            ) {
              found = true;
              regexToTracesMap[regex].traces.push(trace);
            }
          }
          if (!found) {
            const pathTokens = trace.path.split("/");
            let paramNum = 1;
            let parameterizedPath = "";
            let pathRegex = String.raw``;
            for (let j = 0; j < pathTokens.length; j++) {
              const tokenString = pathTokens[j];
              if (tokenString.length > 0) {
                if (isSuspectedParamater(tokenString)) {
                  parameterizedPath += `/{param${paramNum}}`;
                  pathRegex += String.raw`/[^/]+`;
                  paramNum += 1;
                } else {
                  parameterizedPath += `/${tokenString}`;
                  pathRegex += String.raw`/${tokenString}`;
                }
              }
            }
            if (pathRegex.length > 0) {
              pathRegex = String.raw`^${pathRegex}$`;
              const regexKey = `${trace.host}-${trace.method}-${pathRegex}`;
              if (regexToTracesMap[regexKey]) {
                regexToTracesMap[regexKey].traces.push(trace);
              } else {
                regexToTracesMap[regexKey] = {
                  parameterizedPath,
                  host: trace.host,
                  regex: pathRegex,
                  method: trace.method,
                  traces: [trace],
                };
              }
            }
          }
        }
      }
      for (const regex in regexToTracesMap) {
        /** Check if endpoint already exists for the trace */
        //const existingEndpoint = await apiEndpointRepository.findOneBy({ pathRegex: value.regex, method: value.method, host: value.host })

        const value = regexToTracesMap[regex];
        const apiEndpoint = new ApiEndpoint();
        apiEndpoint.path = value.parameterizedPath;
        apiEndpoint.pathRegex = value.regex;
        apiEndpoint.host = value.traces[0].host;
        apiEndpoint.totalCalls = value.traces.length;
        apiEndpoint.method = value.traces[0].method;
        apiEndpoint.owner = value.traces[0].owner;

        // TODO: Do something with setting sensitive data classes during iteration of traces and add auto generated open api spec for inferred endpoints
        for (let i = 0; i < value.traces.length; i++) {
          const trace = value.traces[i];
          await ScannerService.findAllMatchedDataClasses(trace, apiEndpoint);
          trace.apiEndpoint = apiEndpoint;
        }
        await apiEndpointRepository.save(apiEndpoint);
        await apiTraceRepository.save(value.traces);
        await AlertService.createAlert(AlertType.NEW_ENDPOINT, apiEndpoint);
      }
    }
    await this.generateOpenApiSpec();
  }

  static async generateOpenApiSpec(): Promise<void> {
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
    const nonSpecEndpoints = await apiEndpointRepository.findBy({
      openapiSpecName: IsNull(),
    });
    const hostMap: Record<string, ApiEndpoint[]> = {};
    const specIntro = {
      openapi: "3.0.3",
      info: {
        title: "OpenAPI 3.0 Spec",
        description: "An auto-generated OpenAPI 3.0 specification.",
      },
    };
    for (let i = 0; i < nonSpecEndpoints.length; i++) {
      const endpoint = nonSpecEndpoints[i];
      if (hostMap[endpoint.host]) {
        hostMap[endpoint.host].push(endpoint);
      } else {
        hostMap[endpoint.host] = [endpoint];
      }
    }
    for (const host in hostMap) {
      let spec = await openApiSpecRepository.findOneBy({
        name: `${host}-generated`,
      });
      let openApiSpec = {};
      if (spec) {
        openApiSpec = JSON.parse(spec.spec);
      } else {
        spec = new OpenApiSpec();
        spec.name = `${host}-generated`;
        spec.isAutoGenerated = true;
        spec.hosts = [host];
        openApiSpec = {
          ...specIntro,
          servers: [
            {
              url: host,
            },
          ],
          paths: {},
        };
      }
      const endpoints = hostMap[host];
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const paths = openApiSpec["paths"];
        const path = endpoint.path;
        const method = endpoint.method.toLowerCase();
        let whereConditions: FindOptionsWhere<ApiTrace> = {
          apiEndpointUuid: endpoint.uuid,
        };
        if (spec.updatedAt) {
          whereConditions = {
            createdAt: MoreThan(spec.updatedAt),
            ...whereConditions,
          };
        }
        const traces = await apiTraceRepository.find({
          where: { ...whereConditions },
          order: { createdAt: "ASC" },
        });
        let parameters: Record<string, BodySchema> = {};
        let requestBodySpec: BodyContent = {};
        let responses: Responses = {};
        if (paths[path]) {
          if (paths[path][method]) {
            const specParameters = paths[path][method]["parameters"];
            requestBodySpec =
              paths[path][method]["requestBody"]?.["content"] ?? {};
            responses = paths[path][method]["responses"] ?? {};
            for (const parameter of specParameters) {
              parameters[`${parameter?.name}<>${parameter?.in}`] =
                parameter?.schema ?? {};
            }
          } else {
            paths[path][method] = {};
          }
        } else {
          paths[path] = {
            [method]: {},
          };
        }
        for (const trace of traces) {
          const requestParamters = trace.requestParameters;
          const requestHeaders = trace.requestHeaders;
          const requestBody = trace.requestBody;
          const responseHeaders = trace.responseHeaders;
          const responseBody = trace.responseBody;
          const responseStatusString =
            trace.responseStatus?.toString() || "default";
          let requestContentType = null;
          let responseContentType = null;
          for (const requestParameter of requestParamters) {
            const key = `${requestParameter.name}<>query`;
            parameters[key] = this.parseSchema(
              parameters[key] ?? {},
              parsedJsonNonNull(requestParameter.value, true)
            );
          }
          for (const requestHeader of requestHeaders) {
            const key = `${requestHeader.name}<>header`;
            parameters[key] = this.parseSchema(
              parameters[key] ?? {},
              parsedJsonNonNull(requestHeader.value, true)
            );
            if (requestHeader.name.toLowerCase() === "content-type") {
              requestContentType = requestHeader.value.toLowerCase();
            }
          }
          for (const responseHeader of responseHeaders) {
            if (responseHeader.name.toLowerCase() === "content-type") {
              responseContentType = responseHeader.value.toLowerCase();
            }
            if (!responses[responseStatusString]?.headers) {
              responses[responseStatusString] = {
                ...responses[responseStatusString],
                headers: {},
              };
            }
            this.parseContent(
              responses[responseStatusString]?.headers,
              responseHeader.value,
              responseHeader.name
            );
          }

          // Request body only for put, post, options, patch, trace
          this.parseContent(requestBodySpec, requestBody, requestContentType);
          if (responseBody) {
            if (!responses[responseStatusString]?.content) {
              responses[responseStatusString] = {
                ...responses[responseStatusString],
                content: {},
              };
            }
            this.parseContent(
              responses[responseStatusString]?.content,
              responseBody,
              responseContentType
            );
          }
        }
        let specParameterList = [];
        for (const parameter in parameters) {
          const splitParameter = parameter.split("<>");
          specParameterList.push({
            name: splitParameter[0],
            in: splitParameter[1],
            schema: parameters[parameter],
          });
        }
        if (specParameterList.length > 0) {
          paths[path][method]["parameters"] = specParameterList;
        }
        if (Object.keys(requestBodySpec).length > 0) {
          paths[path][method]["requestBody"] = {
            content: {
              ...requestBodySpec,
            },
          };
        }
        if (Object.keys(responses).length > 0) {
          paths[path][method]["responses"] = {
            ...responses,
          };
        }

        // Add endpoint path parameters to parameter list
        endpoint.openapiSpec = spec;
      }
      spec.spec = JSON.stringify(openApiSpec, null, 2);
      spec.extension = SpecExtension.JSON;
      await openApiSpecRepository.save(spec);
      await apiEndpointRepository.save(endpoints);
    }
  }
}
