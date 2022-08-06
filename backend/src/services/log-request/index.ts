import { Raw } from "typeorm";
import { TraceParams } from "../../types";
import { ApiEndpoint, ApiTrace } from "../../../models";
import { AppDataSource } from "../../data-source";
import { ScannerService } from "../scanner/scan";
import Error500InternalServer from "../../errors/error-500-internal-server";

export class LogRequestService {
  static async logRequest(traceParams: TraceParams) {
    try {
      /** Log Request in ApiTrace table */
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
      const path = traceParams?.request?.url?.path;
      const method = traceParams?.request?.method;
      const host = traceParams?.request?.url?.host;
      const requestParameters = traceParams?.request?.url?.parameters;
      const requestHeaders = traceParams?.request?.headers;
      const requestBody = traceParams?.request?.body;
      const responseHeaders = traceParams?.response?.headers;
      const responseBody = traceParams?.response?.body;
      const apiTraceObj = new ApiTrace();
      apiTraceObj.path = path;
      apiTraceObj.method = method;
      apiTraceObj.host = host;
      apiTraceObj.requestParameters = requestParameters;
      apiTraceObj.requestHeaders = requestHeaders;
      apiTraceObj.requestBody = requestBody;
      apiTraceObj.responseStatus = traceParams?.response?.status;
      apiTraceObj.responseHeaders = responseHeaders;
      apiTraceObj.responseBody = responseBody;
      apiTraceObj.meta = traceParams?.meta;

      /** Update existing endpoint record if exists */
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const apiEndpoint = await apiEndpointRepository.findOne({
        where: {
          pathRegex: Raw((alias) => `:path ~ ${alias}`, { path }),
          method,
          host,
        },
        relations: { sensitiveDataClasses: true },
      });
      if (apiEndpoint) {
        apiEndpoint.totalCalls += 1;
        // Check for sensitive data
        ScannerService.findMatchedDataClasses(
          "req.params",
          requestParameters,
          apiEndpoint
        );
        ScannerService.findMatchedDataClasses(
          "req.headers",
          requestHeaders,
          apiEndpoint
        );
        ScannerService.findMatchedDataClasses(
          "res.headers",
          responseHeaders,
          apiEndpoint
        );
        ScannerService.findMatchedDataClassesBody(
          "req.body",
          requestBody,
          apiEndpoint
        );
        ScannerService.findMatchedDataClassesBody(
          "res.body",
          responseBody,
          apiEndpoint
        );
        //TODO: Check in request body and response body, might need to unmarshall the string into json to do data path properly
        apiTraceObj.apiEndpointUuid = apiEndpoint.uuid;
        await apiEndpointRepository.save(apiEndpoint);
      }
      await apiTraceRepository.save(apiTraceObj);
    } catch (err) {
      console.error(`Error in Log Request service: ${err}`);
      throw new Error500InternalServer(err);
    }
  }

  static async logRequestBatch(traceParamsBatch: TraceParams[]) {
    for (let i = 0; i < traceParamsBatch.length; i++) {
      this.logRequest(traceParamsBatch[i]);
    }
  }
}
