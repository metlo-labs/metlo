import { NextFunction, Request, Response } from "express"
import yaml from "js-yaml"
import { parse } from "parse-multipart-data"
import MIMEType from "whatwg-mimetype"
import { TraceParams } from "@common/types"
import { parsedJsonNonNull } from "utils"

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
        parts.forEach(part => (formMap[part.name] = part.data?.toString()))
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
  const traceParams: TraceParams = req.body
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
    req.body.request.body = getParsedBodyString(
      traceParams?.request.body,
      reqMimeType.subtype,
      reqMimeType.parameters,
    )
  } else {
    req.body.request.body =
      JSON.stringify(parsedJsonNonNull(traceParams?.request?.body, true)) ??
      traceParams?.request?.body
  }
  if (responseBodyContentType) {
    const resMimeType = new MIMEType(responseBodyContentType)
    req.body.response.body = getParsedBodyString(
      traceParams?.response?.body,
      resMimeType.subtype,
      resMimeType.parameters,
    )
  } else {
    req.body.response.body =
      JSON.stringify(parsedJsonNonNull(traceParams?.response?.body, true)) ??
      traceParams?.response?.body
  }
  next()
}
