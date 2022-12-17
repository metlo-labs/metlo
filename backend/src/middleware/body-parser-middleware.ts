import { NextFunction, Request, Response } from "express"
import yaml from "js-yaml"
import { parse } from "parse-multipart-data"
import MIMEType from "whatwg-mimetype"
import { TraceParams } from "@common/types"
import { getDataType, parsedJsonNonNull } from "utils"
import { DataType } from "@common/enums"
import ApiResponseHandler from "api-response-handler"
import Error500InternalServer from "errors/error-500-internal-server"

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
): any => {
  try {
    switch (mimeSubtype) {
      case "yaml":
        const yamlObj = yaml.load(bodyString)
        return yamlObj ?? bodyString
      case "x-www-form-urlencoded":
        const entries = Object.fromEntries(new URLSearchParams(bodyString))
        return entries ?? bodyString
      case "form-data":
        const bodyBuffer = Buffer.from(bodyString)
        const boundary = mimeParameters.get("boundary")
        const parts = parse(bodyBuffer, boundary)
        const formMap = {}
        parts.forEach(
          part => (formMap[part.name] = parseData(part.data?.toString())),
        )
        return formMap ?? bodyString
      case "plain":
      case "binary":
      case "json":
      default:
        return bodyString
    }
  } catch (err) {
    console.error(`Encountered error while parsing body string: ${err}`)
    return bodyString
  }
}

const getMimeType = (contentType: string) => {
  try {
    return new MIMEType(contentType)
  } catch (err) {
    return new MIMEType("text/plain")
  }
}

export const bodyParserMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
        const reqMimeType = getMimeType(requestBodyContentType)
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
        if (dataType === DataType.ARRAY) {
          req.body[idx].request.body = traceParams?.request?.body
        } else {
          req.body.request.body = traceParams?.request?.body
        }
      }

      if (responseBodyContentType) {
        const resMimeType = getMimeType(responseBodyContentType)
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
        if (dataType === DataType.ARRAY) {
          req.body[idx].response.body = traceParams?.response?.body
        } else {
          req.body.response.body = traceParams?.response?.body
        }
      }
    })

    next()
  } catch (err) {
    console.log(err)
    await ApiResponseHandler.error(res, new Error500InternalServer(err))
  }
}
