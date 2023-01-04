import MIMEType from "whatwg-mimetype"
import crypto from "crypto"
import { PairObject, QueuedApiTrace } from "@common/types"
import { DataSection, DataTag, DataType } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import {
  getDataType,
  getRiskScore,
  isParameter,
  parsedJson,
  parsedJsonNonNull,
} from "utils"
import { getPathTokens } from "@common/utils"
import { ScannerService } from "services/scanner/scan"
import Error404NotFound from "errors/error-404-not-found"
import { addDataClass } from "./utils"
import { createQB, getRepository } from "services/database/utils"
import { MetloContext } from "types"

export class DataFieldService {
  static dataFields: Record<string, DataField>
  static updatedFields: Record<string, DataField>
  static newFields: Record<string, DataField>
  static traceCreatedAt: Date
  static dataFieldsLength: number
  static traceHashObj: Record<string, string[]>

  static getContentTypes(
    requestHeaders: PairObject[],
    responseHeaders: PairObject[],
  ): { reqContentType: string; resContentType: string } {
    let reqContentType = "*/*"
    let resContentType = "*/*"
    for (const requestHeader of requestHeaders) {
      const lower = requestHeader.name.toLowerCase()
      if (lower === "content-type") {
        try {
          reqContentType = new MIMEType(requestHeader.value)?.essence
          break
        } catch {}
      }
    }
    for (const responseHeader of responseHeaders) {
      const lower = responseHeader.name.toLowerCase()
      if (lower === "content-type") {
        try {
          resContentType = new MIMEType(responseHeader.value)?.essence
          break
        } catch {}
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
    dataClasses: string[],
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
    return newFieldKeys.some(
      e => !oldFields[e] || oldFields[e] !== newFields[e],
    )
  }

  static updateTraceHashObj(
    dataSection: DataSection,
    dataPath: string,
    arrayFields: Record<string, number>,
  ) {
    const arrayFieldsKeys = Object.keys(arrayFields)
    const arrayFieldsLen = arrayFieldsKeys.length
    const sortedArrayFields = arrayFieldsKeys
      .sort()
      .reduce((acc: string, key: string, idx: number) => {
        acc += `${key}#${arrayFields[key]}${
          idx < arrayFieldsLen - 1 ? "::" : ""
        }`
        return acc
      }, "")
    const key =
      (dataPath ?? "") + (sortedArrayFields ? `<>${sortedArrayFields}` : "")
    this.traceHashObj[dataSection].push(key)
  }

  static saveDataField(
    dataClasses: string[],
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
    const existingNullMatch = `-1__${dataSection}${
      dataPath ? `.${dataPath}` : ""
    }`
    const dataType = getDataType(dataValue)
    const nonNullDataSections = [
      DataSection.REQUEST_BODY,
      DataSection.RESPONSE_BODY,
      DataSection.RESPONSE_HEADER,
    ]
    this.updateTraceHashObj(dataSection, dataPath, arrayFields)
    if (
      this.dataFields[existingNullMatch] &&
      nonNullDataSections.includes(dataSection)
    ) {
      const existingDataField = this.dataFields[existingNullMatch]
      if (dataSection === DataSection.REQUEST_BODY) {
        existingDataField.contentType = contentType ?? ""
      } else if (dataSection === DataSection.RESPONSE_HEADER) {
        existingDataField.statusCode = statusCode ?? -1
      } else if (dataSection === DataSection.RESPONSE_BODY) {
        existingDataField.contentType = contentType ?? ""
        existingDataField.statusCode = statusCode ?? -1
      }

      let additionalUpdates = false
      additionalUpdates = addDataClass(existingDataField, dataClasses)
      if (additionalUpdates) {
        existingDataField.dataTag = DataTag.PII
      }

      if (this.isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)) {
        existingDataField.arrayFields = { ...arrayFields }
      }

      if (!existingDataField.isNullable && dataType === DataType.UNKNOWN) {
        existingDataField.isNullable = true
      }

      if (
        existingDataField.dataType !== dataType &&
        this.traceCreatedAt > existingDataField.updatedAt &&
        dataType !== DataType.UNKNOWN
      ) {
        existingDataField.dataType = dataType
      }

      existingDataField.updatedAt = this.traceCreatedAt
      this.dataFields[existingMatch] = existingDataField
      if (this.newFields[existingMatch]) {
        this.newFields[existingMatch] = existingDataField
      } else {
        this.updatedFields[existingMatch] = existingDataField
      }
    } else {
      if (!this.dataFields[existingMatch]) {
        if (this.dataFieldsLength < 200) {
          const dataField = new DataField()
          dataField.dataPath = dataPath ?? ""
          dataField.dataType = dataType
          dataField.dataSection = dataSection
          dataField.apiEndpointUuid = apiEndpoint.uuid
          dataField.dataClasses = []
          dataField.traceHash = {}
          dataField.createdAt = this.traceCreatedAt
          dataField.updatedAt = this.traceCreatedAt
          dataField.contentType = contentType ?? ""
          dataField.statusCode = statusCode ?? -1
          dataField.isNullable = dataType === DataType.UNKNOWN
          dataField.arrayFields = { ...arrayFields }
          if (dataClasses) {
            addDataClass(dataField, dataClasses)
            dataField.dataTag = DataTag.PII
          }
          this.dataFields[existingMatch] = dataField
          this.newFields[existingMatch] = dataField
          this.dataFieldsLength += 1
        }
      } else {
        const existingDataField = this.dataFields[existingMatch]
        let updated = false
        updated = addDataClass(existingDataField, dataClasses)
        if (updated) {
          existingDataField.dataTag = DataTag.PII
        }

        if (
          this.traceCreatedAt > existingDataField.updatedAt &&
          this.isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)
        ) {
          existingDataField.arrayFields = { ...arrayFields }
        }

        if (!existingDataField.isNullable && dataType === DataType.UNKNOWN) {
          existingDataField.isNullable = true
        }

        if (
          existingDataField.dataType !== dataType &&
          this.traceCreatedAt > existingDataField.updatedAt &&
          dataType !== DataType.UNKNOWN
        ) {
          existingDataField.dataType = dataType
        }
        existingDataField.updatedAt = this.traceCreatedAt
        this.dataFields[existingMatch] = existingDataField
        if (this.newFields[existingMatch]) {
          this.newFields[existingMatch] = existingDataField
        } else {
          this.updatedFields[existingMatch] = existingDataField
        }
      }
    }
  }

  static async recursiveParseJson(
    ctx: MetloContext,
    dataPathPrefix: string,
    dataSection: DataSection,
    jsonBody: any,
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
    arrayFields: Record<string, number>,
  ): Promise<void> {
    if (Object(jsonBody) !== jsonBody) {
      const matches = await ScannerService.scan(ctx, jsonBody)
      this.saveDataField(
        matches,
        dataPathPrefix,
        dataSection,
        apiEndpoint,
        jsonBody,
        contentType,
        statusCode,
        arrayFields,
      )
    } else if (jsonBody && Array.isArray(jsonBody)) {
      let l = jsonBody.length
      const arrayFieldKey = dataPathPrefix ?? ""
      if (arrayFields[arrayFieldKey]) {
        arrayFields[arrayFieldKey] += 1
      } else {
        arrayFields[arrayFieldKey] = 1
      }
      for (let i = 0; i < l; i++) {
        await this.recursiveParseJson(
          ctx,
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
        await this.recursiveParseJson(
          ctx,
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

  static async findBodyDataFields(
    ctx: MetloContext,
    dataSection: DataSection,
    body: string,
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
  ): Promise<void> {
    if (!body && dataSection === DataSection.RESPONSE_BODY) {
      body = ""
    }
    const jsonBody = parsedJsonNonNull(body, true)
    if (jsonBody || dataSection === DataSection.RESPONSE_BODY) {
      if (Array.isArray(jsonBody)) {
        const l = jsonBody.length
        const arrayFields = {
          "": 1,
        }
        for (let i = 0; i < l; i++) {
          await this.recursiveParseJson(
            ctx,
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
          await this.recursiveParseJson(
            ctx,
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
        await this.recursiveParseJson(
          ctx,
          null,
          dataSection,
          jsonBody,
          apiEndpoint,
          contentType,
          statusCode,
          {},
        )
      }
    }
  }

  static async findPairObjectDataFields(
    ctx: MetloContext,
    dataSection: DataSection,
    data: PairObject[],
    apiEndpoint: ApiEndpoint,
    contentType: string,
    statusCode: number,
  ): Promise<void> {
    if (data) {
      for (const item of data) {
        const field = item.name
        const jsonBody = parsedJson(item.value)
        await this.recursiveParseJson(
          ctx,
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

  static async findPathDataFields(
    ctx: MetloContext,
    path: string,
    apiEndpoint: ApiEndpoint,
  ): Promise<void> {
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
        await this.recursiveParseJson(
          ctx,
          currToken.slice(1, -1),
          DataSection.REQUEST_PATH,
          tracePathTokens[i],
          apiEndpoint,
          "",
          -1,
          {},
        )
      }
    }
  }

  static async findAllDataFields(
    ctx: MetloContext,
    apiTrace: QueuedApiTrace,
    apiEndpoint: ApiEndpoint,
    returnAllFields?: boolean,
  ): Promise<{ newFields: DataField[]; updatedFields: DataField[] }> {
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
    this.newFields = {}
    this.traceHashObj = {
      [DataSection.REQUEST_HEADER]: [],
      [DataSection.REQUEST_QUERY]: [],
      [DataSection.REQUEST_BODY]: [],
      [DataSection.RESPONSE_HEADER]: [],
      [DataSection.RESPONSE_BODY]: [],
    }
    this.traceCreatedAt = apiTrace.createdAt
    this.findPathDataFields(ctx, apiTrace.path, apiEndpoint)
    if (statusCode < 400) {
      await this.findPairObjectDataFields(
        ctx,
        DataSection.REQUEST_QUERY,
        apiTrace.requestParameters,
        apiEndpoint,
        "",
        -1,
      )
      await this.findPairObjectDataFields(
        ctx,
        DataSection.REQUEST_HEADER,
        apiTrace.requestHeaders,
        apiEndpoint,
        "",
        -1,
      )
      await this.findBodyDataFields(
        ctx,
        DataSection.REQUEST_BODY,
        apiTrace.requestBody,
        apiEndpoint,
        reqContentType,
        -1,
      )
    }
    await this.findPairObjectDataFields(
      ctx,
      DataSection.RESPONSE_HEADER,
      apiTrace.responseHeaders,
      apiEndpoint,
      "",
      statusCode,
    )
    await this.findBodyDataFields(
      ctx,
      DataSection.RESPONSE_BODY,
      apiTrace.responseBody,
      apiEndpoint,
      resContentType,
      statusCode,
    )

    let concatArray = []
    for (const section of Object.keys(this.traceHashObj).sort()) {
      concatArray = concatArray.concat(this.traceHashObj[section].sort())
    }
    const hash = crypto
      .createHash("sha256")
      .update(concatArray.join())
      .digest("base64")

    const res = Object.values(this.dataFields)
    apiEndpoint.riskScore = getRiskScore(res)
    const newFields = []
    const updatedFields = []
    for (const field in this.newFields) {
      this.newFields[field].traceHash[hash] = this.traceCreatedAt.getTime()
      newFields.push(this.newFields[field])
    }
    for (const field in this.updatedFields) {
      this.updatedFields[field].traceHash[hash] = this.traceCreatedAt.getTime()
      updatedFields.push(this.updatedFields[field])
    }
    return {
      newFields: newFields ?? [],
      updatedFields: updatedFields ?? [],
    }
  }
}
