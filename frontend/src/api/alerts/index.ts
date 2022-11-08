import axios, { AxiosRequestHeaders } from "axios"
import { GetAlertParams, Alert, UpdateAlertParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const getAlerts = async (
  params: GetAlertParams,
  headers?: AxiosRequestHeaders,
): Promise<[Alert[], number]> => {
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
