import { In, Raw } from "typeorm"
import { PairObject, TraceParams } from "@common/types"
import { ApiEndpoint, ApiTrace, DataField, Alert, BlockFields } from "models"
import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { SpecService } from "services/spec"
import { DataFieldService } from "services/data-field"
import { DatabaseService } from "services/database"
import { AlertService } from "services/alert"
import { DataType, DisableRestMethod } from "@common/enums"
import { getDataType, parsedJson } from "utils"

export class LogRequestService {
  static isContained(arr: string[], str: string) {
    return arr.some(e => e.toLowerCase() === str.toLowerCase())
  }

  static recursiveParseBody(
    dataPath: string,
    dataSection: string,
    jsonBody: any,
    disabledPaths: string[],
  ): void {
    const dataType = getDataType(jsonBody)
    const path = dataPath ? `${dataSection}.${dataPath}` : dataSection
    if (dataType === DataType.OBJECT) {
      for (const key in jsonBody) {
        if (this.isContained(disabledPaths, `${path}.${key}`)) {
          delete jsonBody[key]
        } else {
          this.recursiveParseBody(
            `${dataPath}.${key}`,
            dataSection,
            jsonBody[key],
            disabledPaths,
          )
        }
      }
    } else if (dataType === DataType.ARRAY) {
      for (const item of jsonBody) {
        this.recursiveParseBody(dataPath, dataSection, item, disabledPaths)
      }
    }
  }

  static removeBlockedFieldsBodyData(
    body: string,
    dataSection: string,
    disabledPaths: string[],
  ) {
    if (!body) {
      return
    }
    if (this.isContained(disabledPaths, dataSection)) {
      return {}
    }
    const jsonBody = parsedJson(body)
    if (jsonBody) {
      const dataType = getDataType(jsonBody)
      if (dataType === DataType.OBJECT) {
        for (let key in jsonBody) {
          if (this.isContained(disabledPaths, `${dataSection}.${key}`)) {
            delete jsonBody[key]
          } else {
            this.recursiveParseBody(
              key,
              dataSection,
              jsonBody[key],
              disabledPaths,
            )
          }
        }
      } else if (dataType === DataType.ARRAY) {
        for (let item of jsonBody) {
          this.recursiveParseBody("", dataSection, item, disabledPaths)
        }
      }
    }
    return jsonBody ?? body
  }

  static removeBlockedFieldsPairObject(
    data: PairObject[],
    dataSection: string,
    disabledPaths: string[],
  ): PairObject[] {
    if (!data) {
      return data
    }
    if (this.isContained(disabledPaths, dataSection)) {
      return []
    }
    let res: PairObject[] = []
    for (const item of data) {
      const field = item.name
      if (!this.isContained(disabledPaths, `${dataSection}.${field}`)) {
        res.push(item)
      }
    }
    return res
  }

  static async removeBlockedFields(apiTrace: ApiTrace) {
    const blockFieldsRepo = AppDataSource.getRepository(BlockFields)
    const blockFieldEntry = await blockFieldsRepo.findOne({
      where: {
        host: apiTrace.host,
        method: In([apiTrace.method, DisableRestMethod.ALL]),
        pathRegex: Raw(alias => `:path ~ ${alias}`, { path: apiTrace.path }),
      },
      order: {
        numberParams: "ASC",
      },
    })
    if (blockFieldEntry) {
      const disabledPaths = blockFieldEntry.disabledPaths
      const validRequestParams = this.removeBlockedFieldsPairObject(
        apiTrace.requestParameters,
        "req.params",
        disabledPaths,
      )
      const validRequestHeaders = this.removeBlockedFieldsPairObject(
        apiTrace.requestHeaders,
        "req.headers",
        disabledPaths,
      )
      const validRequestBody = this.removeBlockedFieldsBodyData(
        apiTrace.requestBody,
        "req.body",
        disabledPaths,
      )
      const validResponseHeaders = this.removeBlockedFieldsPairObject(
        apiTrace.responseHeaders,
        "res.headers",
        disabledPaths,
      )
      const validResponseBody = this.removeBlockedFieldsBodyData(
        apiTrace.responseBody,
        "res.body",
        disabledPaths,
      )

      apiTrace.requestParameters = validRequestParams
      apiTrace.requestHeaders = validRequestHeaders
      apiTrace.requestBody = JSON.stringify(validRequestBody)
      apiTrace.responseHeaders = validResponseHeaders
      apiTrace.responseBody = JSON.stringify(validResponseBody)
    }
  }

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

      await this.removeBlockedFields(apiTraceObj)
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
          apiEndpoint.path,
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
