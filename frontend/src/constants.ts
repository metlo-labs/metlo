import { RiskScore, DataClass, DataTag, Status } from "@common/enums"

export const METHOD_TO_COLOR = {
  GET: "green",
  POST: "orange",
}

export const RISK_TO_COLOR = {
  [RiskScore.NONE]: "green",
  [RiskScore.LOW]: "gray",
  [RiskScore.MEDIUM]: "orange",
  [RiskScore.HIGH]: "red",
}

export const STATUS_TO_COLOR = {
  [Status.RESOLVED]: "green",
  [Status.IGNORED]: "gray",
  [Status.OPEN]: "blue",
}

export const TAG_TO_COLOR = {
  [DataTag.PII]: "blue",
}

export const RISK_SCORE_ORDER: Record<RiskScore, number> = {
  [RiskScore.HIGH]: 3,
  [RiskScore.MEDIUM]: 2,
  [RiskScore.LOW]: 1,
  [RiskScore.NONE]: 0,
}

export const statusToColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) {
    return "green"
  }
  return "red"
}
export const getAPIURL = () => {
  return `${
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BACKEND_URL || "http://localhost:8080"
  }/api/v1`
}

export const ENDPOINT_PAGE_LIMIT = 10
export const ALERT_PAGE_LIMIT = 10
