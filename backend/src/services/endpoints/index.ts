import { IsNull } from "typeorm";
import { isSuspectedParamater } from "../../utils";
import { ApiEndpoint, ApiTrace } from "../../../models";
import { AppDataSource } from "../../data-source";
import { RestMethod } from "../../enums";

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
        let found = false;
        const regexes = Object.keys(regexToTracesMap);
        for (let x = 0; x < regexes.length && !found; x++) {
          const regex = regexes[x];
          if (
            RegExp(regex).test(`${trace.host}-${trace.method}-${trace.path}`)
          ) {
            found = true;
            regexToTracesMap[regex].traces.push(trace);
            /*regexToTracesMap[regex] = {
              ...regexToTracesMap[regex],
              traces: [...regexToTracesMap[regex].traces, trace],
            };*/
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
            const regexKey = `${trace.host}-${trace.method}-${pathRegex}`;
            if (regexToTracesMap[regexKey]) {
              regexToTracesMap[regexKey].traces.push(trace);
              /*regexToTracesMap[pathRegex] = {
                ...regexToTracesMap[pathRegex],
                traces: [...regexToTracesMap[pathRegex].traces, trace],
              };*/
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
      Object.entries(regexToTracesMap).map(async ([regex, value], idx) => {
        const apiEndpoint = new ApiEndpoint();
        apiEndpoint.path = value.parameterizedPath;
        apiEndpoint.pathRegex = value.regex;
        apiEndpoint.host = value.traces[0].host;
        apiEndpoint.totalCalls = value.traces.length;
        apiEndpoint.method = value.traces[0].method;
        apiEndpoint.owner = value.traces[0].owner;
        await apiEndpointRepository.save(apiEndpoint);
        // TODO: Do something with setting sensitive data classes during iteration of traces and add auto generated open api spec for inferred endpoints
        for (let i = 0; i < value.traces.length; i++) {
          const trace = value.traces[i];
          trace.apiEndpoint = apiEndpoint;
          await apiTraceRepository.save(trace);
        }
      });
    }
  }
}
