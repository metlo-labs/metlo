import axios, { AxiosRequestConfig } from "axios"
import FormData from "form-data"

import { TestRequest } from "../types/test"
import { Context } from "../types/context"
import { stringReplacement } from "../utils"

axios.interceptors.request.use(
  function (config) {
    // @ts-ignore
    config.metadata = { startTime: new Date() }
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

axios.interceptors.response.use(
  function (response) {
    // @ts-ignore
    response.config.metadata.endTime = new Date()
    // @ts-ignore
    response.duration =
      // @ts-ignore
      response.config.metadata.endTime - response.config.metadata.startTime
    return response
  },
  function (error) {
    error.config.metadata.endTime = new Date()
    error.duration =
      error.config.metadata.endTime - error.config.metadata.startTime
    return Promise.reject(error)
  },
)

const BLOCKED_HOSTS = new Set(process.env.METLO_TEST_BLOCKED_HOSTS?.split(","))

export const makeRequest = (
  req: TestRequest,
  ctx: Context,
): AxiosRequestConfig<any> => {
  const currentUrl = stringReplacement(req.url, ctx.envVars)
  const urlObj = new URL(currentUrl)

  if (BLOCKED_HOSTS.has(urlObj.host)) {
    throw new Error(`Host ${urlObj.host} is not allowed...`)
  }

  const host = urlObj.host
  const queryParams = req.query
    ?.map(
      ({ name, value }) =>
        `${stringReplacement(name, ctx.envVars)}=${stringReplacement(
          value,
          ctx.envVars,
        )}`,
    )
    .join("&")
  const currUrlCookies = ctx.cookies[host] || {}
  const headers: Record<string, string> = Object.fromEntries(
    (req.headers || []).map(({ name, value }) => [
      stringReplacement(name, ctx.envVars),
      stringReplacement(value, ctx.envVars),
    ]),
  )

  let data: any = undefined
  if (req.form) {
    headers["Content-Type"] = "multipart/form-data"
    const formData = new FormData()
    req.form.forEach(({ name, value }) =>
      formData.append(
        stringReplacement(name, ctx.envVars),
        stringReplacement(value, ctx.envVars),
      ),
    )
    data = formData
  } else if (req.data) {
    data = stringReplacement(req.data, ctx.envVars)
  }

  headers["Cookie"] = Object.entries(currUrlCookies)
    .map(([k, v]) => {
      return `${k}=${v}`
    })
    .join(";")

  if (
    !Object.keys(headers)
      .map(e => e.toLowerCase())
      .includes("accept-encoding")
  ) {
    headers["Accept-Encoding"] = "*"
  }

  let url = currentUrl
  if ((queryParams || "").length > 0) {
    url = currentUrl + `?${queryParams}`
  }

  return {
    url,
    method: req.method,
    headers: headers,
    data,
    timeout: 10000,
    validateStatus: () => true,
  }
}
