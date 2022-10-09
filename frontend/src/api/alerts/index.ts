import axios from "axios"
import { GetAlertParams, Alert, UpdateAlertParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const getAlerts = async (
  params: GetAlertParams,
): Promise<[Alert[], number]> => {
  const resp = await axios.get<[Alert[], number]>(`${getAPIURL()}/alerts`, {
    params,
  })
  return resp.data
}

export const resolveAlert = async (
  alertId: string,
  resolutionMessage: string,
): Promise<Alert> => {
  const resp = await axios.put<Alert>(
    `${getAPIURL()}/alert/resolve/${alertId}`,
    { resolutionMessage },
  )
  return resp.data
}

export const updateAlert = async (
  alertId: string,
  updateAlertParams: UpdateAlertParams,
): Promise<Alert> => {
  const resp = await axios.put<Alert>(
    `${getAPIURL()}/alert/${alertId}`,
    updateAlertParams,
  )
  return resp.data
}
