import { PairObject } from "@common/types"
import { DataClass, DataSection, DataTag, DataType } from "@common/enums"
import { ApiEndpoint, ApiTrace, DataField } from "models"
import { getDataType, getRiskScore, isParameter, parsedJson } from "utils"
import { getPathTokens } from "@common/utils"
import { ScannerService } from "services/scanner/scan"
import { AppDataSource } from "data-source"

export class DataFieldService {
  static async updateDataClasses(
    dataFieldId: string,
    dataClasses: DataClass[],
    dataPath: string,
    dataSection: DataSection,
  ) {
    const dataFieldRepository = AppDataSource.getRepository(DataField)
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

  static existingDataField(
    dataFields: DataField[],
    dataPath: string,
    dataSection: DataSection,
  ) {
    for (let i = 0; i < dataFields?.length; i++) {
      const dataField = dataFields[i]
      if (
        dataField.dataPath === dataPath &&
        dataField.dataSection === dataSection
      ) {
        return i
      }
    }
    return null
  }

  static saveDataField(
    dataClass: DataClass,
    dataPath: string,
    dataSection: DataSection,
    apiEndpoint: ApiEndpoint,
    matches: string[],
    dataValue: any,
    dataFields: DataField[],
    updatedFields: DataField[],
  ): void {
    const existingDataFieldIdx = this.existingDataField(
      dataFields,
      dataPath,
      dataSection,
    )
    const dataType = getDataType(dataValue)

    if (existingDataFieldIdx === null) {
      const dataField = new DataField()
      dataField.dataPath = dataPath
      dataField.dataType = dataType
      dataField.dataSection = dataSection
      dataField.apiEndpointUuid = apiEndpoint.uuid
      dataField.dataClasses = []
      if (dataClass && matches?.length > 0) {
        dataField.addDataClass(dataClass)
        dataField.dataTag = DataTag.PII
        dataField.updateMatches(dataClass, matches)
      }
      dataFields.push(dataField)
      updatedFields.push(dataField)
    } else {
      const existingDataField = dataFields[existingDataFieldIdx]
      let updated = false
      updated = existingDataField.addDataClass(dataClass)
      updated = existingDataField.updateMatches(dataClass, matches) || updated
      if (updated) {
        existingDataField.dataTag = DataTag.PII
      }

      if (existingDataField.dataType !== dataType) {
        existingDataField.dataType = dataType
        updated = true
      }
      if (updated) {
        updatedFields.push(existingDataField)
      }
    }
  }

  static recursiveParseJson(
    dataPathPrefix: string,
    dataSection: DataSection,
    jsonBody: any,
    apiEndpoint: ApiEndpoint,
    dataFields: DataField[],
    updatedFields: DataField[],
  ): void {
    if (getDataType(jsonBody) === DataType.OBJECT) {
      for (const key in jsonBody) {
        this.recursiveParseJson(
          `${dataPathPrefix}.${key}`,
          dataSection,
          jsonBody[key],
          apiEndpoint,
          dataFields,
          updatedFields,
        )
      }
    } else if (getDataType(jsonBody) === DataType.ARRAY) {
      for (const item of jsonBody) {
        this.recursiveParseJson(
          dataPathPrefix,
          dataSection,
          item,
          apiEndpoint,
          dataFields,
          updatedFields,
        )
      }
    } else {
      const matches = ScannerService.scan(jsonBody)
      const matchesKeys = Object.keys(matches)
      if (matchesKeys?.length > 0) {
        for (const match of matchesKeys) {
          const matchDataClass = match as DataClass
          this.saveDataField(
            matchDataClass,
            dataPathPrefix,
            dataSection,
            apiEndpoint,
            matches[match],
            jsonBody,
            dataFields,
            updatedFields,
          )
        }
      } else {
        this.saveDataField(
          null,
          dataPathPrefix,
          dataSection,
          apiEndpoint,
          [],
          jsonBody,
          dataFields,
          updatedFields,
        )
      }
    }
  }

  static findBodyDataFields(
    dataSection: DataSection,
    body: string,
    apiEndpoint: ApiEndpoint,
    dataFields: DataField[],
    updatedFields: DataField[],
  ): void {
    if (!body) {
      return
    }
    const jsonBody = parsedJson(body)
    if (jsonBody) {
      const dataType = getDataType(jsonBody)
      if (dataType === DataType.OBJECT) {
        for (let key in jsonBody) {
          this.recursiveParseJson(
            key,
            dataSection,
            jsonBody[key],
            apiEndpoint,
            dataFields,
            updatedFields,
          )
        }
      } else if (dataType === DataType.ARRAY) {
        for (let item of jsonBody) {
          this.recursiveParseJson(
            "",
            dataSection,
            item,
            apiEndpoint,
            dataFields,
            updatedFields,
          )
        }
      }
    } else {
      this.recursiveParseJson(
        "",
        dataSection,
        body,
        apiEndpoint,
        dataFields,
        updatedFields,
      )
    }
  }

  static findPairObjectDataFields(
    dataSection: DataSection,
    data: PairObject[],
    apiEndpoint: ApiEndpoint,
    dataFields: DataField[],
    updatedFields: DataField[],
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
          dataFields,
          updatedFields,
        )
      }
    }
  }

  static findPathDataFields(
    path: string,
    apiEndpoint: ApiEndpoint,
    dataFields: DataField[],
    updatedFields: DataField[],
  ): void {
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
          dataFields,
          updatedFields,
        )
      }
    }
  }

  static findAllDataFields(
    apiTrace: ApiTrace,
    apiEndpoint: ApiEndpoint,
    returnAllFields?: boolean,
  ): DataField[] {
    const dataFields: DataField[] = apiEndpoint.dataFields ?? []
    const updatedFields: DataField[] = []
    this.findPathDataFields(
      apiTrace.path,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    this.findPairObjectDataFields(
      DataSection.REQUEST_QUERY,
      apiTrace.requestParameters,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    this.findPairObjectDataFields(
      DataSection.REQUEST_HEADER,
      apiTrace.requestHeaders,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    this.findPairObjectDataFields(
      DataSection.RESPONSE_HEADER,
      apiTrace.responseHeaders,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    this.findBodyDataFields(
      DataSection.REQUEST_BODY,
      apiTrace.requestBody,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    this.findBodyDataFields(
      DataSection.RESPONSE_BODY,
      apiTrace.responseBody,
      apiEndpoint,
      dataFields,
      updatedFields,
    )
    if (returnAllFields) {
      return dataFields
    }
    apiEndpoint.riskScore = getRiskScore(dataFields)
    return updatedFields
  }
}
