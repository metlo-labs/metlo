import { Repository } from "typeorm";
import { TraceParams } from "../../types";
import { ApiTrace } from "../../../models";
import { AppDataSource } from "../../data-source";
import { ScannerService } from "../scanner/scan";

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
      const path = traceParams?.request?.url?.path;
      const method = traceParams?.request?.method;
      const environment = traceParams?.meta?.environment;
      const host = traceParams?.request?.url?.host;
      const requestParameters = traceParams?.request?.url?.parameters;
      const requestHeaders = traceParams?.request?.headers;
      const requestBody = traceParams?.request?.body;
      const responseHeaders = traceParams?.response?.headers;
      const responseBody = traceParams?.response?.body;
      const apiTraceObj = new ApiTrace();
      apiTraceObj.path = path;
      apiTraceObj.method = method;
      apiTraceObj.environment = environment;
      apiTraceObj.host = host;
      apiTraceObj.requestParameters = requestParameters;
      apiTraceObj.requestHeaders = requestHeaders;
      apiTraceObj.requestBody = requestBody;
      apiTraceObj.responseStatus = traceParams?.response?.status;
      apiTraceObj.responseHeaders = responseHeaders;
      apiTraceObj.responseBody = responseBody;
      apiTraceObj.meta = traceParams?.meta;

      // Check for sensitive data in request parameters

      const startTime = performance.now()
      if (requestParameters) {
        for (const param of requestParameters) {
          const field = param.name;
          const matches = ScannerService.scan(param.value);
        }
      }
      console.log(performance.now() - startTime)

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
