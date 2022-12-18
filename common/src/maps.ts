import {
  DataSection,
  DataClass,
  RiskScore,
  AlertType,
  AttackType,
} from "./enums"

export const DATA_SECTION_TO_LABEL_MAP: Record<DataSection, string> = {
  [DataSection.REQUEST_PATH]: "Request Path Parameters",
  [DataSection.REQUEST_QUERY]: "Request Query Parameters",
  [DataSection.REQUEST_HEADER]: "Request Headers",
  [DataSection.REQUEST_BODY]: "Request Body",
  [DataSection.RESPONSE_HEADER]: "Response Headers",
  [DataSection.RESPONSE_BODY]: "Response Body",
}

export const DATA_CLASS_TO_RISK_SCORE: Record<DataClass | "", RiskScore> = {
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
  "": RiskScore.NONE,
}

export const ALERT_TYPE_TO_RISK_SCORE: Record<AlertType, RiskScore> = {
  [AlertType.NEW_ENDPOINT]: RiskScore.LOW,
  [AlertType.OPEN_API_SPEC_DIFF]: RiskScore.MEDIUM,
  [AlertType.PII_DATA_DETECTED]: RiskScore.HIGH,
  [AlertType.QUERY_SENSITIVE_DATA]: RiskScore.HIGH,
  [AlertType.PATH_SENSITIVE_DATA]: RiskScore.HIGH,
  [AlertType.BASIC_AUTHENTICATION_DETECTED]: RiskScore.MEDIUM,
  [AlertType.UNSECURED_ENDPOINT_DETECTED]: RiskScore.HIGH,
  [AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA]: RiskScore.HIGH,
}

export const ATTACK_TYPE_TO_RISK_SCORE: Record<AttackType, RiskScore> = {
  [AttackType.HIGH_ERROR_RATE]: RiskScore.HIGH,
  [AttackType.ANOMALOUS_CALL_ORDER]: RiskScore.MEDIUM,
  [AttackType.BOLA]: RiskScore.HIGH,
  [AttackType.HIGH_USAGE_SENSITIVE_ENDPOINT]: RiskScore.HIGH,
  [AttackType.UNAUTHENTICATED_ACCESS]: RiskScore.HIGH,
}