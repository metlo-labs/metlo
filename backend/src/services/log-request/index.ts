import { Repository } from "typeorm";
import { TraceParams } from "../../types";
import { ApiTrace } from "../../../models";
import { AppDataSource } from "../../data-source";

let API_TRACE_REPOSITORY = AppDataSource.getRepository(ApiTrace);
export class LogRequestService {
  static getApiTraceRepository(): Repository<ApiTrace> {
    if (!API_TRACE_REPOSITORY) {
      API_TRACE_REPOSITORY = AppDataSource.getRepository(ApiTrace);
    }
    return API_TRACE_REPOSITORY;
  }

  static async logRequest(traceParams: TraceParams) {
    try {
      /** Log Request in ApiTrace table */
      const apiTraceRepository = this.getApiTraceRepository();
      const path = traceParams.request.url.path;
      const method = traceParams.request.method;
      const environment = traceParams.meta.environment;
      const host = traceParams.request.url.host;
      const apiTraceObj = new ApiTrace();
      apiTraceObj.path = path;
      apiTraceObj.method = method;
      apiTraceObj.environment = environment;
      apiTraceObj.host = host;
      apiTraceObj.requestParameters = traceParams.request.url.parameters;
      apiTraceObj.requestHeaders = traceParams.request.headers;
      apiTraceObj.requestBody = traceParams.request.body;
      apiTraceObj.responseStatus = traceParams.response.status;
      apiTraceObj.responseParameters = traceParams.response.url.parameters;
      apiTraceObj.responseHeaders = traceParams.response.headers;
      apiTraceObj.responseBody = traceParams.response.body;
      apiTraceObj.meta = traceParams.meta;
      await apiTraceRepository.save(apiTraceObj)

      //TODO: Log Request in ApiEndpoint table
      //TODO: Find sensitive data in request and response and add data classes and data paths to tables
    } catch (err) {
      console.error(`Error in Log Request service: ${err}`)
    }
  }

  static async logRequestBatch(traceParamsBatch: TraceParams[]) {
    for (let i = 0; i < traceParamsBatch.length; i++) {
      this.logRequest(traceParamsBatch[i])
    }
  }
}
