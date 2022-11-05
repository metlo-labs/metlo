import { DataType, DisableRestMethod } from "@common/enums"
import { getDataType, isParameter, parsedJson, parsedJsonNonNull } from "utils"
import { BlockFieldEntry, PairObject, QueuedApiTrace } from "@common/types"
import { getPathTokens } from "@common/utils"
import { BLOCK_FIELDS_ALL_REGEX, BLOCK_FIELDS_LIST_KEY } from "~/constants"
import { isSensitiveDataKey } from "./utils"
import { BlockFields } from "models"
import { getRepoQB } from "services/database/utils"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"

export class BlockFieldsService {
  static getNumberParams(
    pathRegex: string,
    method: DisableRestMethod,
    path: string,
  ) {
    let numParams = 0
    if (pathRegex === BLOCK_FIELDS_ALL_REGEX) {
      numParams += 1000
    } else if (method === DisableRestMethod.ALL) {
      numParams += 500
    }
    if (path) {
      const pathTokens = getPathTokens(path)
      for (let i = 0; i < pathTokens.length; i++) {
        const token = pathTokens[i]
        if (isParameter(token)) {
          numParams += 1
        }
      }
      return numParams
    }
    return 0
  }

  static async getBlockFieldsEntry(
    ctx: MetloContext,
    apiTrace: QueuedApiTrace,
  ): Promise<BlockFieldEntry> {
    const redisKey = `block_fields_${apiTrace.host}`
    let cachedBlockFields: any = await RedisClient.getFromRedis(ctx, redisKey)
    if (!cachedBlockFields) {
      const blockFieldEntries = await getRepoQB(ctx, BlockFields)
        .createQueryBuilder()
        .where("host = :host", { host: apiTrace.host })
        .getMany()

      cachedBlockFields = blockFieldEntries
      RedisClient.addToRedis(ctx, redisKey, JSON.stringify(blockFieldEntries))
      RedisClient.addValueToSet(ctx, BLOCK_FIELDS_LIST_KEY, [
        `block_fields_${apiTrace.host}`,
      ])
    } else {
      cachedBlockFields = JSON.parse(cachedBlockFields)
    }
    let res = null
    if (cachedBlockFields?.length > 0) {
      for (const item of cachedBlockFields) {
        const regex = new RegExp(item.pathRegex)
        if (
          (item.method === DisableRestMethod[apiTrace.method] ||
            item.method === DisableRestMethod.ALL) &&
          regex.test(apiTrace.path) &&
          (res === null || item.numberParams < res?.numberParams)
        ) {
          res = item
        }
      }
    }
    return res
  }

  static isContained(arr: string[], str: string): boolean {
    const strLower = str.toLowerCase()
    for (const e of arr) {
      const entryLower = e.toLowerCase().trim()
      if (entryLower === strLower) {
        return true
      }
    }
    return false
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
        if (redacted || contained || isSensitiveDataKey(key)) {
          jsonBody[key] = this.recursiveParseBody(
            `${dataPath}.${key}`,
            dataSection,
            jsonBody[key],
            disabledPaths,
            true,
          )
        } else {
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
    let redacted = false
    if (this.isContained(disabledPaths, dataSection)) {
      redacted = true
    }

    let jsonBody = parsedJson(body)
    if (jsonBody) {
      const dataType = getDataType(jsonBody)
      if (dataType === DataType.OBJECT) {
        for (let key in jsonBody) {
          const contained = this.isContained(
            disabledPaths,
            `${dataSection}.${key}`,
          )
          if (redacted || contained || isSensitiveDataKey(key)) {
            jsonBody[key] = this.recursiveParseBody(
              key,
              dataSection,
              jsonBody[key],
              disabledPaths,
              true,
            )
          } else {
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
      }
    } else {
      if (redacted) {
        body = "[REDACTED]"
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
    return data.map(item => {
      const contained = this.isContained(
        disabledPaths,
        `${dataSection}.${item.name}`,
      )

      return {
        name: item.name,
        value: this.recursiveParseBody(
          item.name,
          dataSection,
          parsedJsonNonNull(item.value, true),
          disabledPaths,
          redacted || contained || isSensitiveDataKey(item.name),
        ),
      }
    })
  }

  static async redactBlockedFields(
    ctx: MetloContext,
    apiTrace: QueuedApiTrace,
  ) {
    const blockFieldEntry = await this.getBlockFieldsEntry(ctx, apiTrace)
    const disabledPaths = blockFieldEntry?.disabledPaths ?? {
      reqQuery: [],
      reqHeaders: [],
      reqBody: [],
      resHeaders: [],
      resBody: [],
    }

    const validRequestParams = this.redactBlockedFieldsPairObject(
      apiTrace.requestParameters,
      "req.query",
      disabledPaths.reqQuery,
    )
    const validRequestHeaders = this.redactBlockedFieldsPairObject(
      apiTrace.requestHeaders,
      "req.headers",
      disabledPaths.reqHeaders,
    )
    const validRequestBody = this.redactBlockedFieldsBodyData(
      apiTrace.requestBody,
      "req.body",
      disabledPaths.reqBody,
    )
    const validResponseHeaders = this.redactBlockedFieldsPairObject(
      apiTrace.responseHeaders,
      "res.headers",
      disabledPaths.resHeaders,
    )
    const validResponseBody = this.redactBlockedFieldsBodyData(
      apiTrace.responseBody,
      "res.body",
      disabledPaths.resBody,
    )

    apiTrace.requestParameters = validRequestParams
    apiTrace.requestHeaders = validRequestHeaders
    apiTrace.requestBody = validRequestBody
    apiTrace.responseHeaders = validResponseHeaders
    apiTrace.responseBody = validResponseBody
  }
}
