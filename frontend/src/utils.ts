import { DataClass, RiskScore } from "@common/enums"
import axios, { AxiosError } from "axios"
import { getTime } from "date-fns"
import { DateTime } from "luxon"
import { DATA_CLASS_TO_RISK_SCORE, RISK_SCORE_ORDER } from "./constants"

export const getDateTimeString = (date: Date) => {
  if (date) {
    return DateTime.fromISO(date.toString()).toLocaleString(
      DateTime.DATETIME_MED,
    )
  }
  return null
}

export async function api_call_retry({
  url,
  requestParams,
  shouldRetry,
  onSuccess,
  onError,
  onAPIError,
  onFinally,
}) {
  const MAX_RETRIES = 20
  const INTERVAL = 2500
  const retries = { count: 0 }
  let start = new Date()
  let interval_id = setInterval(async () => {
    try {
      const resp = await axios.get(url, { ...requestParams })
      if (!shouldRetry(resp)) {
        // We shouldn't retry if the response is acceptable
        clearInterval(interval_id)
        onSuccess(resp)
        return
      }
      retries.count += 1
      if (retries.count >= MAX_RETRIES) {
        clearInterval(interval_id)
        throw new Error(`Couldn't obtain results after ${MAX_RETRIES} retries`)
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        if (onAPIError) {
          onAPIError(err)
        }
        onError(err)
        return
      }
    } finally {
      if (onFinally) onFinally()
    }
  }, INTERVAL)
}

export const getRiskScores = (dataClasses: DataClass[]) =>
  dataClasses?.map(dataClass => DATA_CLASS_TO_RISK_SCORE[dataClass])

export const getMaxRiskScoreFromList = (riskScores: RiskScore[]): RiskScore => {
  let maxRisk = RiskScore.NONE
  for (let i = 0; i < riskScores?.length; i++) {
    if (RISK_SCORE_ORDER[riskScores[i]] > RISK_SCORE_ORDER[maxRisk]) {
      maxRisk = riskScores[i]
    }
  }
  return maxRisk
}
