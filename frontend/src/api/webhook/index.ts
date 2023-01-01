import axios, { AxiosRequestHeaders } from "axios"
import { CreateWebhookParams } from "@common/api/webhook"
import { WebhookResp } from "@common/types"
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

export const updateWebhook = async (
  updateWebhookParams: CreateWebhookParams,
  webhookId: string,
  headers?: AxiosRequestHeaders,
): Promise<WebhookResp[]> => {
  const resp = await axios.put<WebhookResp[]>(
    `${getAPIURL()}/webhook/${webhookId}`,
    updateWebhookParams,
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
