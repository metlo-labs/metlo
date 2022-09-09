import { In, Raw } from "typeorm"
import { DataType, DisableRestMethod } from "@common/enums"
import { getDataType, parsedJson, parsedJsonNonNull } from "utils"
import { PairObject } from "@common/types"
import { ApiTrace, BlockFields } from "models"
import { AppDataSource } from "data-source"

export class BlockFieldsService {
  static async getBlockFieldsEntry(apiTrace: ApiTrace) {
    const blockFieldsRepo = AppDataSource.getRepository(BlockFields)
    return await blockFieldsRepo.findOne({
      where: {
        host: apiTrace.host,
        method: In([apiTrace.method, DisableRestMethod.ALL]),
        pathRegex: Raw(alias => `:path ~ ${alias}`, { path: apiTrace.path }),
      },
      order: {
        numberParams: "ASC",
      },
    })
  }

  static isContained(arr: string[], str: string) {
    return arr.some(e => e.toLowerCase() === str.toLowerCase())
  }

  static recursiveParseBody(
    dataPath: string,
    dataSection: string,
    jsonBody: any,
    disabledPaths: string[],
    redacted: boolean,
  ): any {
    const dataType = getDataType(jsonBody)
    const path = dataPath ? `${dataSection}.${dataPath}` : dataSection
    if (dataType === DataType.OBJECT) {
      for (const key in jsonBody) {
        let tempRedacted = false
        if (redacted || this.isContained(disabledPaths, `${path}.${key}`)) {
          tempRedacted = true
        }
        jsonBody[key] = this.recursiveParseBody(
          `${dataPath}.${key}`,
          dataSection,
          jsonBody[key],
          disabledPaths,
          tempRedacted,
        )
      }
    } else if (dataType === DataType.ARRAY) {
      ;(jsonBody as any[]).forEach((item, idx) => {
        jsonBody[idx] = this.recursiveParseBody(
          dataPath,
          dataSection,
          item,
          disabledPaths,
          redacted,
        )
      })
    } else {
      if (redacted) {
        return "[REDACTED]"
      }
      return jsonBody
    }
    return jsonBody
  }

  static redactBlockedFieldsBodyData(
    body: string,
    dataSection: string,
    disabledPaths: string[],
  ) {
    if (!body) {
      return
    }
    let redacted = false
    if (this.isContained(disabledPaths, dataSection)) {
      redacted = true
    }
    let jsonBody = parsedJson(body)
    if (jsonBody) {
      const dataType = getDataType(jsonBody)
      if (dataType === DataType.OBJECT) {
        for (let key in jsonBody) {
          let tempRedacted = false
          if (
            redacted ||
            this.isContained(disabledPaths, `${dataSection}.${key}`)
          ) {
            tempRedacted = true
          }
          jsonBody[key] = this.recursiveParseBody(
            key,
            dataSection,
            jsonBody[key],
            disabledPaths,
            tempRedacted,
          )
        }
      } else if (dataType === DataType.ARRAY) {
        ;(jsonBody as any[]).forEach((item, idx) => {
          jsonBody[idx] = this.recursiveParseBody(
            "",
            dataSection,
            item,
            disabledPaths,
            redacted,
          )
        })
      } else {
        if (redacted) {
          jsonBody = "[REDACTED]"
        }
      }
    } else {
      if (redacted) {
        jsonBody = "[REDACTED]"
      }
    }
    return jsonBody ?? body
  }

  static redactBlockedFieldsPairObject(
    data: PairObject[],
    dataSection: string,
    disabledPaths: string[],
  ): PairObject[] {
    if (!data) {
      return data
    }
    let redacted = false
    if (this.isContained(disabledPaths, dataSection)) {
      redacted = true
    }
    return data.map(item => ({
      name: item.name,
      value: this.recursiveParseBody(
        item.name,
        dataSection,
        parsedJsonNonNull(item.value, true),
        disabledPaths,
        redacted ||
          this.isContained(disabledPaths, `${dataSection}.${item.name}`),
      ),
    }))
  }

  static async redactBlockedFields(apiTrace: ApiTrace) {
    const blockFieldEntry = await this.getBlockFieldsEntry(apiTrace)
    if (blockFieldEntry) {
      const disabledPaths = blockFieldEntry.disabledPaths
      const validRequestParams = this.redactBlockedFieldsPairObject(
        apiTrace.requestParameters,
        "req.query",
        disabledPaths,
      )
      const validRequestHeaders = this.redactBlockedFieldsPairObject(
        apiTrace.requestHeaders,
        "req.headers",
        disabledPaths,
      )
      const validRequestBody = this.redactBlockedFieldsBodyData(
        apiTrace.requestBody,
        "req.body",
        disabledPaths,
      )
      const validResponseHeaders = this.redactBlockedFieldsPairObject(
        apiTrace.responseHeaders,
        "res.headers",
        disabledPaths,
      )
      const validResponseBody = this.redactBlockedFieldsBodyData(
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
