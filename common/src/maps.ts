import {
  DataSection,
  RiskScore,
  AlertType,
  AttackType,
  __DataClass_INTERNAL__,
} from "./enums"

export const DATA_SECTION_TO_LABEL_MAP: Record<DataSection, string> = {
  [DataSection.REQUEST_PATH]: "Request Path Parameters",
  [DataSection.REQUEST_QUERY]: "Request Query Parameters",
  [DataSection.REQUEST_HEADER]: "Request Headers",
  [DataSection.REQUEST_BODY]: "Request Body",
  [DataSection.RESPONSE_HEADER]: "Response Headers",
  [DataSection.RESPONSE_BODY]: "Response Body",
}

export const __DATA_CLASS_TO_RISK_SCORE_INTERNAL__: Record<__DataClass_INTERNAL__ | "", RiskScore> = {
  [__DataClass_INTERNAL__.ADDRESS]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.EMAIL]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.CREDIT_CARD]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.SSN]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.PHONE_NUMBER]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.IP_ADDRESS]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.DOB]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.VIN]: RiskScore.LOW,
  [__DataClass_INTERNAL__.COORDINATE]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.DL_NUMBER]: RiskScore.MEDIUM,
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