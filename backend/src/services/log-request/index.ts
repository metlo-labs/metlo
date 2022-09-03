import { Raw } from "typeorm"
import { TraceParams } from "@common/types"
import { ApiEndpoint, ApiTrace, DataField, Alert } from "models"
import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { SpecService } from "services/spec"
import { DataFieldService } from "services/data-field"
import { DatabaseService } from "services/database"
import { AlertService } from "services/alert"

export class LogRequestService {
  static async logRequest(traceParams: TraceParams): Promise<void> {
    try {
      /** Log Request in ApiTrace table */
      const path = traceParams?.request?.url?.path
      const method = traceParams?.request?.method
      const host = traceParams?.request?.url?.host
      const requestParameters = traceParams?.request?.url?.parameters
      const requestHeaders = traceParams?.request?.headers
      const requestBody = traceParams?.request?.body
      const responseHeaders = traceParams?.response?.headers
      const responseBody = traceParams?.response?.body
      const apiTraceObj = new ApiTrace()
      apiTraceObj.path = path
      apiTraceObj.method = method
      apiTraceObj.host = host
      apiTraceObj.requestParameters = requestParameters
      apiTraceObj.requestHeaders = requestHeaders
      apiTraceObj.requestBody = requestBody
      apiTraceObj.responseStatus = traceParams?.response?.status
      apiTraceObj.responseHeaders = responseHeaders
      apiTraceObj.responseBody = responseBody
      apiTraceObj.meta = traceParams?.meta

      /** Update existing endpoint record if exists */
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const apiEndpoint = await apiEndpointRepository.findOne({
        where: {
          pathRegex: Raw(alias => `:path ~ ${alias}`, { path }),
          method,
          host,
        },
        relations: { dataFields: true },
        order: {
          numberParams: "ASC",
        },
      })
      let dataFields: DataField[] = []
      let alerts: Alert[] = []
      let apiEndpointSave: ApiEndpoint[] = []
      if (apiEndpoint) {
        const currDate = new Date()
        apiEndpoint.totalCalls += 1
        apiTraceObj.createdAt = currDate
        apiEndpoint.updateDates(currDate)
        dataFields = DataFieldService.findAllDataFields(
          apiTraceObj,
          apiEndpoint,
        )
        apiTraceObj.apiEndpointUuid = apiEndpoint.uuid
        alerts = await SpecService.findOpenApiSpecDiff(apiTraceObj, apiEndpoint)
        const sensitiveDataAlerts = await AlertService.createDataFieldAlerts(
          dataFields,
          apiEndpoint.uuid,
          apiTraceObj,
        )
        alerts = alerts?.concat(sensitiveDataAlerts)
        apiEndpointSave = [apiEndpoint]
      }
      await DatabaseService.executeTransactions([[apiTraceObj]], [], true)
      await DatabaseService.executeTransactions(
        [[...alerts], [...apiEndpointSave], [...dataFields]],
        [],
        true,
      )
    } catch (err) {
      console.error(`Error in Log Request service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }

  static async logRequestBatch(traceParamsBatch: TraceParams[]): Promise<void> {
    for (let i = 0; i < traceParamsBatch.length; i++) {
      await this.logRequest(traceParamsBatch[i])
    }
  }
}
