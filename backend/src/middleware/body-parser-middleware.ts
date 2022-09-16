import { NextFunction, Request, Response } from "express"
import yaml from "js-yaml"
import { parse } from "parse-multipart-data"
import MIMEType from "whatwg-mimetype"
import { TraceParams } from "@common/types"
import { getDataType, parsedJsonNonNull } from "utils"
import { DataType } from "@common/enums"

const parseData = (data: string) => {
  if (!data) {
    return ""
  }
  return parsedJsonNonNull(data, true)
}

const getParsedBodyString = (
  bodyString: string,
  mimeSubtype: string,
  mimeParameters: Map<string, string>,
): string => {
  try {
    switch (mimeSubtype) {
      case "yaml":
        const yamlObj = yaml.load(bodyString)
        return JSON.stringify(yamlObj)
      case "x-www-form-urlencoded":
        const entries = Object.fromEntries(new URLSearchParams(bodyString))
        return JSON.stringify(entries)
      case "form-data":
        const bodyBuffer = Buffer.from(bodyString)
        const boundary = mimeParameters.get("boundary")
        const parts = parse(bodyBuffer, boundary)
        const formMap = {}
        parts.forEach(
          part => (formMap[part.name] = parseData(part.data?.toString())),
        )
        return JSON.stringify(formMap)
      case "plain":
        return bodyString
      case "binary":
      case "json":
      default:
        return JSON.stringify(parsedJsonNonNull(bodyString, true))
    }
  } catch (err) {
    console.error(`Encountered error while parsing body string: ${err}`)
    return bodyString
  }
}

export const bodyParserMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let traceParamsList: TraceParams[] = req.body
  const dataType = getDataType(req.body)
  if (dataType !== DataType.ARRAY) {
    traceParamsList = [req.body]
  }
  traceParamsList.forEach((traceParams, idx) => {
    const requestHeaders = traceParams.request?.headers ?? []
    const responseHeaders = traceParams.response?.headers ?? []
    let requestBodyContentType = null
    let responseBodyContentType = null

    requestHeaders.forEach(header => {
      if (header.name.toLowerCase() === "content-type") {
        requestBodyContentType = header.value
      }
    })
    responseHeaders.forEach(header => {
      if (header.name.toLowerCase() === "content-type") {
        responseBodyContentType = header.value
      }
    })

    if (requestBodyContentType) {
      const reqMimeType = new MIMEType(requestBodyContentType)
      const parsedBodyString = getParsedBodyString(
        traceParams?.request?.body,
        reqMimeType?.subtype,
        reqMimeType?.parameters,
      )
      if (dataType === DataType.ARRAY) {
        req.body[idx].request.body = parsedBodyString
      } else {
        req.body.request.body = parsedBodyString
      }
    } else {
      const parsedBodyString =
        JSON.stringify(parsedJsonNonNull(traceParams?.request?.body, true)) ??
        traceParams?.request?.body
      if (dataType === DataType.ARRAY) {
        req.body[idx].request.body = parsedBodyString
      } else {
        req.body.request.body = parsedBodyString
      }
    }

    if (responseBodyContentType) {
      const resMimeType = new MIMEType(responseBodyContentType)
      const parsedBodyString = getParsedBodyString(
        traceParams?.response?.body,
        resMimeType?.subtype,
        resMimeType?.parameters,
      )
      if (dataType === DataType.ARRAY) {
        req.body[idx].response.body = parsedBodyString
      } else {
        req.body.response.body = parsedBodyString
      }
    } else {
      const parsedBodyString =
        JSON.stringify(parsedJsonNonNull(traceParams?.response?.body, true)) ??
        traceParams?.response?.body
      if (dataType === DataType.ARRAY) {
        req.body[idx].response.body = parsedBodyString
      } else {
        req.body.response.body = parsedBodyString
      }
    }
  })

  next()
}
