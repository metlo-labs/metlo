import axios from "axios"
import { GetAlertParams, Alert, UpdateAlertParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const getAlerts = async (
  params: GetAlertParams,
): Promise<[Alert[], number]> => {
  try {
    const resp = await axios.get<[Alert[], number]>(`${getAPIURL()}/alerts`, {
      params,
    })
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return [[], 0]
  } catch (err) {
    console.error(`Error fetching alerts: ${err}`)
    return [[], 0]
  }
}

export const resolveAlert = async (
  alertId: string,
  resolutionMessage: string,
): Promise<Alert> => {
  try {
    const resp = await axios.put<Alert>(
      `${getAPIURL()}/alert/resolve/${alertId}`,
      { resolutionMessage },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    console.error(`Error resolving alert: ${err}`)
    return null
  }
}

export const updateAlert = async (
  alertId: string,
  updateAlertParams: UpdateAlertParams,
) => {
  try {
    const resp = await axios.put<Alert>(
      `${getAPIURL()}/alert/${alertId}`,
      updateAlertParams,
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    console.error(`Error updating alert: ${err}`)
    return null
  }
}
