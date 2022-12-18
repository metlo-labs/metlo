import axios, { AxiosRequestHeaders } from "axios"

import { TestStep } from "../types/test"
import { Context } from "../types/context"

export const runStep = async (step: TestStep, ctx: Context): Promise<Context> => {
    const currentUrl = step.request.url as string
    const queryParams = step.request.query?.map(({ name, value }) => (`${name}=${value}`)).join(",")
    const currentUrlCookies = ctx.cookies.get(currentUrl) || new Map<string, string>()
    const headers: Record<string, string> = {}
    let data: any = undefined

    if (step.request.form) {
        headers["Content-Type"] = "multipart/form-data"
        const formData = new FormData()
        step.request.form.forEach(({ name, value }) => formData.append(name, value))
        data = formData
    } else {
        data = step.request.data
    }

    headers["Cookie"] = Object.entries(currentUrlCookies).map(([k, v]) => { return `${k}=${v}` }).join(";")

    const res = await axios({
        url: currentUrl + ((queryParams || "").length > 0 ? `?${queryParams}` : ""),
        method: step.request.method,
        headers: headers,
        data: step.request.data,
    })

    res.headers["set-cookie"]?.forEach((cookie) => {
        const [name, value] = (cookie.split(";").at(-1) || "").split("=");
        if (name && value) {
            currentUrlCookies.set(name, value)
        }
    })

    ctx.cookies.set(currentUrl, currentUrlCookies)
    return ctx
}