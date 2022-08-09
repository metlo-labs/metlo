import { RiskScore, DataClass, AlertType } from "@common/enums";

export const pathParameterRegex: RegExp = new RegExp(String.raw`/{[^/]+}`, "g");

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

export const RISK_SCORE_ORDER: Record<RiskScore, number> = {
  [RiskScore.HIGH]: 3,
  [RiskScore.MEDIUM]: 2,
  [RiskScore.LOW]: 1,
  [RiskScore.NONE]: 0,
};

export const RISK_SCORE_ORDER_QUERY: string = `
CASE "alert"."riskScore"
  WHEN '${RiskScore.HIGH}' THEN ${RISK_SCORE_ORDER[RiskScore.HIGH]}
  WHEN '${RiskScore.MEDIUM}' THEN ${RISK_SCORE_ORDER[RiskScore.MEDIUM]}
  WHEN '${RiskScore.LOW}' THEN ${RISK_SCORE_ORDER[RiskScore.LOW]}
  WHEN '${RiskScore.NONE}' THEN ${RISK_SCORE_ORDER[RiskScore.NONE]}
END
`;
