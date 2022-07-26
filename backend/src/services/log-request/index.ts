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
      const apiTraceRepository = this.getApiTraceRepository();
      const path = traceParams.request.url.path;
      const method = traceParams.request.method;
      const environment = traceParams.meta.environment;
      const host = traceParams.request.url.host;
      let apiTraceObj = await apiTraceRepository.findOne({where: {path, method, environment, host }, relations: {sensitiveDataClasses: true }});
      if (!apiTraceObj) {
        apiTraceObj = new ApiTrace();
        apiTraceObj.path = path;
        apiTraceObj.method = method;
        apiTraceObj.environment = environment;
        apiTraceObj.host = host;
        apiTraceObj.totalCalls = 0;
      }
      apiTraceObj.totalCalls += 1;
      //TODO: Find sensitive data in request and response and add data classes and data paths to tables
      await apiTraceRepository.save(apiTraceObj)
    } catch (err) {
      console.error(`Error in Log Request service: ${err}`)
    }
  }
}
