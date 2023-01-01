import { z } from "zod"
import axios, { AxiosRequestHeaders } from "axios"
import { Alert } from "@common/types"
import { UpdateAlertParams } from "@common/api/alert"
import { GetAlertParams } from "@common/api/alert"
import { getAPIURL } from "~/constants"

export const getAlerts = async (
  params: GetAlertParams,
  headers?: AxiosRequestHeaders,
): Promise<[Alert[], number]> => {
  if (!z.string().uuid().safeParse(params.uuid).success) {
    params.uuid = undefined
  }
  const resp = await axios.get<[Alert[], number]>(`${getAPIURL()}/alerts`, {
    params,
    headers,
  })
  return resp.data
}

export const resolveAlert = async (
  alertId: string,
  resolutionMessage: string,
  headers?: AxiosRequestHeaders,
): Promise<Alert> => {
  const resp = await axios.put<Alert>(
    `${getAPIURL()}/alert/resolve/${alertId}`,
    { resolutionMessage },
    { headers },
  )
  return resp.data
}

export const updateAlert = async (
  alertId: string,
  updateAlertParams: UpdateAlertParams,
  headers?: AxiosRequestHeaders,
): Promise<Alert> => {
  const resp = await axios.put<Alert>(
    `${getAPIURL()}/alert/${alertId}`,
    updateAlertParams,
    { headers },
  )
  return resp.data
}
