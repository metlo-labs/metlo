import axios, { AxiosRequestHeaders } from "axios"
import { CreateWebhookParams, WebhookResp } from "@common/types"
import { getAPIURL } from "~/constants"

export const getWebhooks = async (
  headers?: AxiosRequestHeaders,
): Promise<WebhookResp[]> => {
  const resp = await axios.get<WebhookResp[]>(`${getAPIURL()}/webhooks`, {
    headers,
  })
  return resp.data
}

export const createWebhook = async (
  createWebhookParams: CreateWebhookParams,
  headers?: AxiosRequestHeaders,
): Promise<WebhookResp[]> => {
  const resp = await axios.post<WebhookResp[]>(
    `${getAPIURL()}/webhook`,
    createWebhookParams,
    { headers },
  )
  return resp.data
}

export const deleteWebhook = async (
  webhookId: string,
  headers?: AxiosRequestHeaders,
): Promise<WebhookResp[]> => {
  const resp = await axios.delete<WebhookResp[]>(
    `${getAPIURL()}/webhook/${webhookId}`,
    { headers },
  )
  return resp.data
}
