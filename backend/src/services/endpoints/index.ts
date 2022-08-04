import { IsNull } from "typeorm";
import { isSuspectedParamater } from "../../utils";
import { ApiEndpoint, ApiTrace } from "../../../models";
import { AppDataSource } from "../../data-source";
import { RestMethod } from "@common/enums";

interface GenerateEndpoint {
  parameterizedPath: string;
  host: string;
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
          const curr = regexToTracesMap[regex];
          if (
            RegExp(regex).test(trace.path) &&
            trace.host === curr.host &&
            trace.method === curr.method
          ) {
            found = true;
            regexToTracesMap[regex] = {
              ...regexToTracesMap[regex],
              traces: [...regexToTracesMap[regex].traces, trace],
            };
          }
        }
        if (!found) {
          const pathTokens = trace.path.split("/");
          let paramNum = 1;
          let parameterizedPath = "";
          let pathRegex = String.raw``;
          for (let j = 0; j < pathTokens.length; j++) {
            const tokenString = pathTokens[j];
            if (isSuspectedParamater(tokenString)) {
              parameterizedPath += `/{param${paramNum}}`;
              pathRegex += String.raw`/[^/]+`;
              paramNum += 1;
            } else {
              parameterizedPath += `/${tokenString}`;
              pathRegex += String.raw`/${tokenString}`;
            }
          }
          if (pathRegex.length > 0) {
            if (regexToTracesMap[pathRegex]) {
              regexToTracesMap[pathRegex] = {
                ...regexToTracesMap[pathRegex],
                traces: [...regexToTracesMap[pathRegex].traces, trace],
              };
            } else {
              regexToTracesMap[pathRegex] = {
                parameterizedPath,
                host: trace.host,
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
        apiEndpoint.host = value.traces[0].host;
        apiEndpoint.totalCalls = value.traces.length;
        apiEndpoint.method = value.traces[0].method;
        apiEndpoint.owner = value.traces[0].owner;
        await apiEndpointRepository.save(apiEndpoint);
        // TODO: Do something with setting sensitive data classes during iteration of traces
        for (let i = 0; i < value.traces.length; i++) {
          const trace = value.traces[i];
          trace.apiEndpoint = apiEndpoint;
          await apiTraceRepository.save(trace);
        }
      });
    }
  }
}
