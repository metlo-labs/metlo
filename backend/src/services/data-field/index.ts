import { PairObject, QueuedApiTrace } from "@common/types"
import { DataClass, DataSection, DataTag, DataType } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import { getDataType, getRiskScore, isParameter, parsedJson } from "utils"
import { getPathTokens } from "@common/utils"
import { ScannerService } from "services/scanner/scan"
import Error404NotFound from "errors/error-404-not-found"
import { addDataClass } from "./utils"
import { createQB, getRepository } from "services/database/utils"
import { MetloContext } from "types"

export class DataFieldService {
  static dataFields: Record<string, DataField>
  static updatedFields: Record<string, DataField>
  static traceCreatedAt: Date
  static dataFieldsLength: number

  static async deleteDataField(
    ctx: MetloContext,
    dataFieldId: string,
  ): Promise<DataField> {
    const dataFieldRepository = getRepository(ctx, DataField)
    const dataField = await dataFieldRepository.findOneBy({ uuid: dataFieldId })
    const fieldUuid = dataField.uuid
    if (!dataField) {
      throw new Error404NotFound("DataField for provided id not found.")
    }
    await createQB(ctx)
      .delete()
      .from(DataField)
      .andWhere("uuid = :uuid", { uuid: fieldUuid })
      .execute()
    return {
      ...dataField,
      uuid: fieldUuid,
    } as DataField
  }

  static async updateDataClasses(
    ctx: MetloContext,
    dataFieldId: string,
    dataClasses: DataClass[],
    dataPath: string,
    dataSection: DataSection,
  ) {
    const dataFieldRepository = getRepository(ctx, DataField)
    const dataField = await dataFieldRepository.findOneBy({
      uuid: dataFieldId,
      dataPath,
      dataSection,
    })
    dataField.dataClasses = dataClasses
    dataField.falsePositives = dataField.scannerIdentified.filter(
      e => !dataClasses.includes(e),
    )
    dataField.dataTag = dataField.dataClasses.length > 0 ? DataTag.PII : null
    return await dataFieldRepository.save(dataField)
  }

  static saveDataField(
    dataClass: DataClass,
    dataPath: string,
    dataSection: DataSection,
    apiEndpoint: ApiEndpoint,
    dataValue: any,
  ): void {
    const existingMatch = `${dataSection}${dataPath ? `.${dataPath}` : ""}`
    const dataType = getDataType(dataValue)
    if (!this.dataFields[existingMatch]) {
      if (this.dataFieldsLength < 200) {
        const dataField = new DataField()
        dataField.dataPath = dataPath ?? ""
        dataField.dataType = dataType
        dataField.dataSection = dataSection
        dataField.apiEndpointUuid = apiEndpoint.uuid
        dataField.dataClasses = []
        dataField.createdAt = this.traceCreatedAt
        dataField.updatedAt = this.traceCreatedAt
        if (dataClass) {
          addDataClass(dataField, dataClass)
          dataField.dataTag = DataTag.PII
        }
        this.dataFields[existingMatch] = dataField
        this.updatedFields[existingMatch] = dataField
        this.dataFieldsLength += 1
      }
    } else {
      const existingDataField = this.dataFields[existingMatch]
      let updated = false
      updated = addDataClass(existingDataField, dataClass)
      if (updated) {
        existingDataField.dataTag = DataTag.PII
      }

      if (
        existingDataField.dataType !== dataType &&
        this.traceCreatedAt > existingDataField.updatedAt &&
        dataType !== DataType.UNKNOWN
      ) {
        existingDataField.dataType = dataType
        updated = true
      }
      if (updated) {
        existingDataField.updatedAt = this.traceCreatedAt
        this.updatedFields[existingMatch] = existingDataField
      }
    }
  }

  static recursiveParseJson(
    dataPathPrefix: string,
    dataSection: DataSection,
    jsonBody: any,
    apiEndpoint: ApiEndpoint,
  ): void {
    if (Object(jsonBody) !== jsonBody) {
      const matches = ScannerService.scan(jsonBody)
      const l = matches.length
      if (l > 0) {
        for (let i = 0; i < l; i++) {
          this.saveDataField(
            matches[i],
            dataPathPrefix,
            dataSection,
            apiEndpoint,
            jsonBody,
          )
        }
      } else {
        this.saveDataField(
          null,
          dataPathPrefix,
          dataSection,
          apiEndpoint,
          jsonBody,
        )
      }
    } else if (jsonBody && Array.isArray(jsonBody)) {
      let l = jsonBody.length
      for (let i = 0; i < l; i++) {
        this.recursiveParseJson(
          dataPathPrefix,
          dataSection,
          jsonBody[i],
          apiEndpoint,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (const key in jsonBody) {
        this.recursiveParseJson(
          dataPathPrefix ? dataPathPrefix + "." + key : key,
          dataSection,
          jsonBody[key],
          apiEndpoint,
        )
      }
    }
  }

  static findBodyDataFields(
    dataSection: DataSection,
    body: string,
    apiEndpoint: ApiEndpoint,
  ): void {
    if (!body) {
      return
    }
    const jsonBody = parsedJson(body)
    if (jsonBody) {
      if (Array.isArray(jsonBody)) {
        const l = jsonBody.length
        for (let i = 0; i < l; i++) {
          this.recursiveParseJson(null, dataSection, jsonBody[i], apiEndpoint)
        }
      } else if (typeof jsonBody === DataType.OBJECT) {
        for (let key in jsonBody) {
          this.recursiveParseJson(key, dataSection, jsonBody[key], apiEndpoint)
        }
      } else {
        this.recursiveParseJson(null, dataSection, jsonBody, apiEndpoint)
      }
    } else {
      this.recursiveParseJson(null, dataSection, body, apiEndpoint)
    }
  }

  static findPairObjectDataFields(
    dataSection: DataSection,
    data: PairObject[],
    apiEndpoint: ApiEndpoint,
  ): void {
    if (data) {
      for (const item of data) {
        const field = item.name
        const jsonBody = parsedJson(item.value)
        this.recursiveParseJson(
          field,
          dataSection,
          jsonBody ?? item.value,
          apiEndpoint,
        )
      }
    }
  }

  static findPathDataFields(path: string, apiEndpoint: ApiEndpoint): void {
    if (!path || !apiEndpoint?.path) {
      return
    }
    const tracePathTokens = getPathTokens(path)
    const endpointPathTokens = getPathTokens(apiEndpoint.path)
    if (tracePathTokens.length !== endpointPathTokens.length) {
      return
    }
    for (let i = 0; i < endpointPathTokens.length; i++) {
      const currToken = endpointPathTokens[i]
      if (isParameter(currToken)) {
        this.recursiveParseJson(
          currToken.slice(1, -1),
          DataSection.REQUEST_PATH,
          tracePathTokens[i],
          apiEndpoint,
        )
      }
    }
  }

  static findAllDataFields(
    apiTrace: QueuedApiTrace,
    apiEndpoint: ApiEndpoint,
    returnAllFields?: boolean,
  ): DataField[] {
    this.dataFields = apiEndpoint.dataFields.reduce((obj, item) => {
      return {
        ...obj,
        [`${item.dataSection}${item.dataPath ? `.${item.dataPath}` : ""}`]:
          item,
      }
    }, {})
    this.dataFieldsLength = apiEndpoint.dataFields.length ?? 0
    this.updatedFields = {}
    this.traceCreatedAt = apiTrace.createdAt
    this.findPathDataFields(apiTrace.path, apiEndpoint)
    if (apiTrace.responseStatus < 400) {
      this.findPairObjectDataFields(
        DataSection.REQUEST_QUERY,
        apiTrace.requestParameters,
        apiEndpoint,
      )
      this.findPairObjectDataFields(
        DataSection.REQUEST_HEADER,
        apiTrace.requestHeaders,
        apiEndpoint,
      )
      this.findBodyDataFields(
        DataSection.REQUEST_BODY,
        apiTrace.requestBody,
        apiEndpoint,
      )
    }
    this.findPairObjectDataFields(
      DataSection.RESPONSE_HEADER,
      apiTrace.responseHeaders,
      apiEndpoint,
    )
    this.findBodyDataFields(
      DataSection.RESPONSE_BODY,
      apiTrace.responseBody,
      apiEndpoint,
    )
    const res = Object.values(this.dataFields)
    if (returnAllFields) {
      return res
    }
    apiEndpoint.riskScore = getRiskScore(res)
    return Object.values(this.updatedFields)
  }
}
