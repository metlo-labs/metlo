import axios from "axios"

import { TestRequest } from "../types/test"
import { Context } from "../types/context"
import { processEnvVars } from "../utils"

export const makeRequest = async (req: TestRequest, ctx: Context) => {
  const currentUrl = processEnvVars(req.url, ctx.envVars)
  const urlObj = new URL(req.url)
  const host = urlObj.host
  const queryParams = req.query
    ?.map(({ name, value }) => `${name}=${value}`)
    .join(",")
  const currUrlCookies = ctx.cookies.get(host) || new Map<string, string>()
  const headers: Record<string, string> = {}

  let data: any = undefined
  if (req.form) {
    headers["Content-Type"] = "multipart/form-data"
    const formData = new FormData()
    req.form.forEach(({ name, value }) => formData.append(name, value))
    data = formData
  } else {
    data = processEnvVars(req.data, ctx.envVars)
  }

  headers["Cookie"] = Object.entries(currUrlCookies)
    .map(([k, v]) => {
      return `${k}=${v}`
    })
    .join(";")

  return await axios({
    url: currentUrl + ((queryParams || "").length > 0 ? `?${queryParams}` : ""),
    method: req.method,
    headers: headers,
    data: req.data,
  })
}