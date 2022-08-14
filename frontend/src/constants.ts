import { RiskScore, DataClass } from "@common/enums";

export const METHOD_TO_COLOR = {
  GET: "green",
  POST: "orange",
};

export const RISK_TO_COLOR = {
  [RiskScore.NONE]: "green",
  [RiskScore.LOW]: "gray",
  [RiskScore.MEDIUM]: "orange",
  [RiskScore.HIGH]: "red",
};

export const DATA_CLASS_TO_RISK_SCORE: Record<DataClass, RiskScore> = {
  [DataClass.ADDRESS]: RiskScore.HIGH,
  [DataClass.EMAIL]: RiskScore.MEDIUM,
  [DataClass.CREDIT_CARD]: RiskScore.HIGH,
  [DataClass.SSN]: RiskScore.HIGH,
  [DataClass.PHONE_NUMBER]: RiskScore.MEDIUM,
  [DataClass.IP_ADDRESS]: RiskScore.MEDIUM,
  [DataClass.DOB]: RiskScore.MEDIUM,
  [DataClass.VIN]: RiskScore.LOW,
  [DataClass.COORDINATE]: RiskScore.MEDIUM,
  [DataClass.DL_NUMBER]: RiskScore.MEDIUM,
};

export const asdfgetAPIURL = () => {
  return `${
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BACKEND_URL || "http://localhost:8080"
  }/api/v1`;
};

export const ENDPOINT_PAGE_LIMIT = 10;
export const ALERT_PAGE_LIMIT = 10;
