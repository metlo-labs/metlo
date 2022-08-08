import { RiskScore, DataClass, AlertType } from "./enums";

export const pathParameterRegex = new RegExp(String.raw`/{[^/]+}`, "g");

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

export const ALERT_TYPE_TO_RISK_SCORE: Record<AlertType, RiskScore> = {
  [AlertType.NEW_ENDPOINT]: RiskScore.LOW,
  [AlertType.OPEN_API_SPEC_DIFF]: RiskScore.LOW,
  [AlertType.PII_DATA_DETECTED]: RiskScore.HIGH,
  [AlertType.UNDOCUMENTED_ENDPOINT]: RiskScore.LOW,
};
