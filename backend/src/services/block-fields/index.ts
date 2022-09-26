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

  static isContained(arr: string[], str: string): {fully: boolean, partially: boolean } {
    let res = { fully: false, partially: false }
    const strLower = str.toLowerCase()
    arr.forEach(e => {
      const entryLower = e.toLowerCase()
      if (entryLower === strLower) {
        res["fully"] = true
        res["partially"] = true
        return res
      } else if (entryLower.includes(strLower)) {
        res["partially"] = true
      }
    })
    return res
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
        const contained = this.isContained(disabledPaths, `${path}.${key}`)
        if (redacted || contained.fully) {
          jsonBody[key] = this.recursiveParseBody(
            `${dataPath}.${key}`,
            dataSection,
            jsonBody[key],
            disabledPaths,
            true,
          )
        } else if (contained.partially) {
          jsonBody[key] = this.recursiveParseBody(
            `${dataPath}.${key}`,
            dataSection,
            jsonBody[key],
            disabledPaths,
            false,
          )
        }
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
    if (!disabledPaths || disabledPaths?.length === 0) {
      return body
    }
    let redacted = false
    if (this.isContained(disabledPaths, dataSection).fully) {
      redacted = true
    }
    let jsonBody = parsedJson(body)
    if (jsonBody) {
      const dataType = getDataType(jsonBody)
      if (dataType === DataType.OBJECT) {
        for (let key in jsonBody) {
          const contained = this.isContained(disabledPaths, `${dataSection}.${key}`)
          if (
            redacted ||
            contained.fully
          ) {
            jsonBody[key] = this.recursiveParseBody(
              key,
              dataSection,
              jsonBody[key],
              disabledPaths,
              true,
            )
          } else if (contained.partially) {
            jsonBody[key] = this.recursiveParseBody(
              key,
              dataSection,
              jsonBody[key],
              disabledPaths,
              false,
            )
          }

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
    if (!disabledPaths || disabledPaths?.length === 0) {
      return data
    }
    let redacted = false
    if (this.isContained(disabledPaths, dataSection).fully) {
      redacted = true
    }
    return data.map(item => {
      const contained = this.isContained(disabledPaths, `${dataSection}.${item.name}`)
      if (!redacted && !contained.fully && !contained.partially) {
        return item
      }

      return ({
        name: item.name,
        value: this.recursiveParseBody(
          item.name,
          dataSection,
          parsedJsonNonNull(item.value, true),
          disabledPaths,
          redacted || contained.fully,
        ),
      })
    })
  }

  static async redactBlockedFields(apiTrace: ApiTrace) {
    const blockFieldEntry = await this.getBlockFieldsEntry(apiTrace)
    if (blockFieldEntry) {
      const disabledPaths = blockFieldEntry.disabledPaths
      const validRequestParams = this.redactBlockedFieldsPairObject(
        apiTrace.requestParameters,
        "req.query",
        disabledPaths.filter(e => e.includes("req.query")),
      )
      const validRequestHeaders = this.redactBlockedFieldsPairObject(
        apiTrace.requestHeaders,
        "req.headers",
        disabledPaths.filter(e => e.includes("req.headers")),
      )
      const validRequestBody = this.redactBlockedFieldsBodyData(
        apiTrace.requestBody,
        "req.body",
        disabledPaths.filter(e => e.includes("req.body")),
      )
      const validResponseHeaders = this.redactBlockedFieldsPairObject(
        apiTrace.responseHeaders,
        "res.headers",
        disabledPaths.filter(e => e.includes("res.headers")),
      )
      const validResponseBody = this.redactBlockedFieldsBodyData(
        apiTrace.responseBody,
        "res.body",
        disabledPaths.filter(e => e.includes("res.body")),
      )

      apiTrace.requestParameters = validRequestParams
      apiTrace.requestHeaders = validRequestHeaders
      apiTrace.requestBody = validRequestBody
      apiTrace.responseHeaders = validResponseHeaders
      apiTrace.responseBody = validResponseBody
    }
  }
}
