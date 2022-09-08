import { In, Raw } from "typeorm"
import { DataType, DisableRestMethod } from "@common/enums"
import { getDataType, parsedJson } from "utils"
import { PairObject } from "@common/types"
import { ApiTrace, BlockFields } from "models"
import { AppDataSource } from "data-source"

export class BlockFieldsService {
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
}
