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

  static getContentTypes(
    requestHeaders: PairObject[],
    responseHeaders: PairObject[],
  ): { reqContentType: string; resContentType: string } {
    let reqContentType = "*/*"
    let resContentType = "*/*"
    for (const requestHeader of requestHeaders) {
      const lower = requestHeader.name.toLowerCase()
      if (lower === "content-type") {
        reqContentType = requestHeader.value
        break
      }
    }
    for (const responseHeader of responseHeaders) {
      const lower = responseHeader.name.toLowerCase()
      if (lower === "content-type") {
        resContentType = responseHeader.value
        break
      }
    }
    return {
      reqContentType,
      resContentType,
    }
  }

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

  static isArrayFieldsDiff(
    oldFields: Record<string, number>,
    newFields: Record<string, number>,
  ) {
    if ((oldFields && !newFields) || (!oldFields && newFields)) {
      return true
    }
    const newFieldKeys = Object.keys(newFields)
    const oldFieldKeys = Object.keys(oldFields)
    if (newFieldKeys.length !== oldFieldKeys.length) {
      return true
    }
    let res = false
    for (const field of newFieldKeys) {
      if (!oldFields[field]) {
        res = true
        break
      } else if (oldFields[field] !== newFields[field]) {
        res = true
        break
      }
    }
    return res
  }

  static saveDataField(
    dataClass: DataClass,
    dataPath: string,
    dataSection: DataSection,
    apiEndpoint: ApiEndpoint,
    dataValue: any,
    contentType: string,
    statusCode: number,
    arrayFields: Record<string, number>,
  ): void {
    const existingMatch = `${statusCode}_${contentType}_${dataSection}${
      dataPath ? `.${dataPath}` : ""
    }`
    const existingNullMatch = `null_null_${dataSection}${
      dataPath ? `.${dataPath}` : ""
    }`
    const dataType = getDataType(dataValue)
    const nonNullDataSections = [
      DataSection.REQUEST_BODY,
      DataSection.RESPONSE_BODY,
      DataSection.RESPONSE_HEADER,
    ]

    if (
      this.dataFields[existingNullMatch] &&
      nonNullDataSections.includes(dataSection)
    ) {
      const existingDataField = this.dataFields[existingNullMatch]
      if (dataSection === DataSection.REQUEST_BODY) {
        existingDataField.contentType = contentType
      } else if (dataSection === DataSection.RESPONSE_HEADER) {
        existingDataField.statusCode = statusCode
      } else if (dataSection === DataSection.RESPONSE_BODY) {
        existingDataField.contentType = contentType
        existingDataField.statusCode = statusCode
      }

      let additionalUpdates = false
      additionalUpdates = addDataClass(existingDataField, dataClass)
      if (additionalUpdates) {
        existingDataField.dataTag = DataTag.PII
      }

      if (this.isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)) {
        existingDataField.arrayFields = arrayFields
      }

      if (
        existingDataField.dataType !== dataType &&
        this.traceCreatedAt > existingDataField.updatedAt &&
        dataType !== DataType.UNKNOWN
      ) {
        existingDataField.dataType = dataType
      }

      existingDataField.updatedAt = this.traceCreatedAt
      this.updatedFields[existingMatch] = existingDataField
    } else {
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
          dataField.contentType = contentType
          dataField.statusCode = statusCode
          dataField.arrayFields = arrayFields
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
          this.isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)
        ) {
          updated = true
          existingDataField.arrayFields = arrayFields
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
  }

  static recursiveParseJson(
    dataPathPrefix: string,
    dataSection: DataSection,
    jsonBody: any,
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
    arrayFields: Record<string, number>,
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
            contentType,
            statusCode,
            arrayFields,
          )
        }
      } else {
        this.saveDataField(
          null,
          dataPathPrefix,
          dataSection,
          apiEndpoint,
          jsonBody,
          contentType,
          statusCode,
          arrayFields,
        )
      }
    } else if (jsonBody && Array.isArray(jsonBody)) {
      let l = jsonBody.length
      const arrayFieldKey = dataPathPrefix ?? ""
      if (arrayFields[arrayFieldKey]) {
        arrayFields[arrayFieldKey] += 1
      } else {
        arrayFields[arrayFieldKey] = 1
      }
      for (let i = 0; i < l; i++) {
        this.recursiveParseJson(
          dataPathPrefix,
          dataSection,
          jsonBody[i],
          apiEndpoint,
          contentType,
          statusCode,
          arrayFields,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (const key in jsonBody) {
        this.recursiveParseJson(
          dataPathPrefix ? dataPathPrefix + "." + key : key,
          dataSection,
          jsonBody[key],
          apiEndpoint,
          contentType,
          statusCode,
          arrayFields,
        )
      }
    }
  }

  static findBodyDataFields(
    dataSection: DataSection,
    body: string,
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
  ): void {
    if (!body) {
      return
    }
    const jsonBody = parsedJson(body)
    console.log(jsonBody)
    if (jsonBody) {
      if (Array.isArray(jsonBody)) {
        const l = jsonBody.length
        const arrayFields = {
          "": 1,
        }
        for (let i = 0; i < l; i++) {
          this.recursiveParseJson(
            null,
            dataSection,
            jsonBody[i],
            apiEndpoint,
            contentType,
            statusCode,
            arrayFields,
          )
        }
      } else if (typeof jsonBody === DataType.OBJECT) {
        for (let key in jsonBody) {
          this.recursiveParseJson(
            key,
            dataSection,
            jsonBody[key],
            apiEndpoint,
            contentType,
            statusCode,
            {},
          )
        }
      } else {
        this.recursiveParseJson(
          null,
          dataSection,
          jsonBody,
          apiEndpoint,
          contentType,
          statusCode,
          {},
        )
      }
    } else {
      this.recursiveParseJson(
        null,
        dataSection,
        body,
        apiEndpoint,
        contentType,
        statusCode,
        {},
      )
    }
  }

  static findPairObjectDataFields(
    dataSection: DataSection,
    data: PairObject[],
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
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
          contentType,
          statusCode,
          {},
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
          null,
          null,
          {},
        )
      }
    }
  }

  static findAllDataFields(
    apiTrace: QueuedApiTrace,
    apiEndpoint: ApiEndpoint,
    returnAllFields?: boolean,
  ): DataField[] {
    const statusCode = apiTrace.responseStatus
    const { reqContentType, resContentType } = this.getContentTypes(
      apiTrace.requestHeaders,
      apiTrace.responseHeaders,
    )
    this.dataFields = apiEndpoint.dataFields.reduce((obj, item) => {
      return {
        ...obj,
        [`${item.statusCode}_${item.contentType}_${item.dataSection}${
          item.dataPath ? `.${item.dataPath}` : ""
        }`]: item,
      }
    }, {})
    this.dataFieldsLength = apiEndpoint.dataFields.length ?? 0
    this.updatedFields = {}
    this.traceCreatedAt = apiTrace.createdAt
    this.findPathDataFields(apiTrace.path, apiEndpoint)
    if (statusCode < 400) {
      this.findPairObjectDataFields(
        DataSection.REQUEST_QUERY,
        apiTrace.requestParameters,
        apiEndpoint,
        null,
        null,
      )
      this.findPairObjectDataFields(
        DataSection.REQUEST_HEADER,
        apiTrace.requestHeaders,
        apiEndpoint,
        null,
        null,
      )
      this.findBodyDataFields(
        DataSection.REQUEST_BODY,
        apiTrace.requestBody,
        apiEndpoint,
        reqContentType,
        null,
      )
    }
    this.findPairObjectDataFields(
      DataSection.RESPONSE_HEADER,
      apiTrace.responseHeaders,
      apiEndpoint,
      null,
      statusCode,
    )
    this.findBodyDataFields(
      DataSection.RESPONSE_BODY,
      apiTrace.responseBody,
      apiEndpoint,
      resContentType,
      statusCode,
    )
    const res = Object.values(this.dataFields)
    if (returnAllFields) {
      return res
    }
    apiEndpoint.riskScore = getRiskScore(res)
    return Object.values(this.updatedFields)
  }
}
