import { IsNull, Raw } from "typeorm";
import { isSuspectedParamater } from "../../utils";
import { ApiEndpoint, ApiTrace, OpenApiSpec } from "../../../models";
import { AppDataSource } from "../../data-source";
import { AlertType, RestMethod, SpecExtension } from "../../enums";
import { ScannerService } from "../scanner/scan";
import { AlertService } from "../../services/alert";

interface GenerateEndpoint {
  parameterizedPath: string;
  host: string;
  regex: string;
  method: RestMethod;
  traces: ApiTrace[];
}

export class EndpointsService {
  static async generateEndpointsFromTraces() {
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
      Object.entries(regexToTracesMap).forEach(async ([regex, value]) => {
        /** Check if endpoint already exists for the trace */
        //const existingEndpoint = await apiEndpointRepository.findOneBy({ pathRegex: value.regex, method: value.method, host: value.host })

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
      });
    }
    setTimeout(async () => await this.generateOpenApiSpec(), 1000);
  }

  static async generateOpenApiSpec() {
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const nonSpecEndpoints = await apiEndpointRepository.findBy({
      openapiSpecName: IsNull(),
    });
    const hostMap: Record<string, ApiEndpoint[]> = {};
    const specIntro = {
      openapi: "3.0.0",
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
    Object.keys(hostMap).forEach(async (host) => {
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
        if (paths[path]) {
          paths[path][method] = {};
        } else {
          paths[path] = {
            [method]: {},
          };
        }
        endpoint.openapiSpec = spec;
      }
      spec.spec = JSON.stringify(openApiSpec, null, 2);
      spec.extension = SpecExtension.JSON;
      await openApiSpecRepository.save(spec);
      await apiEndpointRepository.save(endpoints);
    });
  }
}
