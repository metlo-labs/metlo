import { DataType } from "@common/enums"
import { BodySchema, BodyContent } from "./types"
import { getDataType, parsedJson } from "utils"

export const parseSchema = (bodySchema: BodySchema, parsedBody: any) => {
  const dataType = getDataType(parsedBody)
  if (dataType === DataType.OBJECT) {
    if (Object.keys(parsedBody).length === 0) {
      bodySchema = {
        type: DataType.OBJECT,
        properties: {
          ...bodySchema?.properties,
        },
      }
    }
    for (let property in parsedBody) {
      bodySchema = {
        type: DataType.OBJECT,
        properties: {
          ...bodySchema?.properties,
          [property]: parseSchema(
            bodySchema?.properties?.[property],
            parsedBody[property],
          ),
        },
      }
    }
    return bodySchema
  } else if (dataType === DataType.ARRAY) {
    const l = parsedBody.length
    if (l === 0) {
      bodySchema = {
        type: DataType.ARRAY,
        items: {
          ...bodySchema?.items,
        },
      }
    }
    for (let i = 0; i < l; i++) {
      bodySchema = {
        type: DataType.ARRAY,
        items: parseSchema(bodySchema?.items, parsedBody[i] ?? ""),
      }
    }
    return bodySchema
  } else if (dataType === DataType.UNKNOWN) {
    if (bodySchema?.type) {
      return {
        type: bodySchema?.type,
        nullable: true,
      }
    }
    return {
      nullable: true,
    }
  } else {
    if (bodySchema?.nullable) {
      return {
        type: dataType,
        nullable: true,
      }
    } else {
      return {
        type: dataType,
      }
    }
  }
}

export const parseContent = (
  bodySpec: BodyContent,
  bodyString: string,
  key: string,
) => {
  let parsedBody = parsedJson(bodyString)
  let nonNullKey: string
  if (!parsedBody && bodyString) {
    nonNullKey = key || "*/*"
    parsedBody = bodyString
  } else if (parsedBody) {
    nonNullKey = key || "*/*"
  } else {
    return
  }
  if (!bodySpec?.[nonNullKey]) {
    bodySpec[nonNullKey] = { schema: {} }
  }
  bodySpec[nonNullKey] = {
    schema: parseSchema(bodySpec[nonNullKey].schema, parsedBody),
  }
}
