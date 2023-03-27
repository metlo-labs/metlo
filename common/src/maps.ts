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

export const PATH_TO_DATA_SECTION: Record<string, DataSection> = {
  "req.path": DataSection.REQUEST_PATH,
  "req.query": DataSection.REQUEST_QUERY,
  "req.header": DataSection.REQUEST_HEADER,
  "req.body": DataSection.REQUEST_BODY,
  "res.header": DataSection.RESPONSE_HEADER,
  "res.body": DataSection.RESPONSE_BODY,
}

export const __DATA_CLASS_TO_RISK_SCORE_INTERNAL__: Record<
  __DataClass_INTERNAL__ | "",
  RiskScore
> = {
  [__DataClass_INTERNAL__.ADDRESS]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.EMAIL]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.CREDIT_CARD]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.SSN]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.PHONE_NUMBER]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.IP_ADDRESS]: RiskScore.LOW,
  [__DataClass_INTERNAL__.DOB]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.VIN]: RiskScore.LOW,
  [__DataClass_INTERNAL__.COORDINATE]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.DL_NUMBER]: RiskScore.MEDIUM,
  [__DataClass_INTERNAL__.AADHAR_NUMBER]: RiskScore.HIGH,
  [__DataClass_INTERNAL__.BRAZIL_CPF]: RiskScore.HIGH,
  "": RiskScore.NONE,
}

export const __DATA_CLASS_TO_SHORT_NAME_INTERNAL__ = {
  [__DataClass_INTERNAL__.CREDIT_CARD]: "CCN",
  [__DataClass_INTERNAL__.SSN]: "SSN",
  [__DataClass_INTERNAL__.IP_ADDRESS]: "IP",
  [__DataClass_INTERNAL__.DOB]: "DOB",
  [__DataClass_INTERNAL__.VIN]: "VIN",
  [__DataClass_INTERNAL__.COORDINATE]: "Coordinates",
  [__DataClass_INTERNAL__.DL_NUMBER]: "DL",
  [__DataClass_INTERNAL__.AADHAR_NUMBER]: "Aadhar",
  [__DataClass_INTERNAL__.PHONE_NUMBER]: "Phone Num",
  [__DataClass_INTERNAL__.BRAZIL_CPF]: "CPF",
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
