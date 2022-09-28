import {
  DataSection,
  AWS_STEPS,
  GCP_STEPS,
  DataClass,
  RiskScore,
  AlertType,
  AttackType,
} from "./enums"

export const AWS_NEXT_STEP: Record<AWS_STEPS, AWS_STEPS | null> = {
  [AWS_STEPS.AWS_KEY_SETUP]: AWS_STEPS.SOURCE_INSTANCE_ID,
  [AWS_STEPS.SOURCE_INSTANCE_ID]: AWS_STEPS.SELECT_OS,
  [AWS_STEPS.SELECT_OS]: AWS_STEPS.SELECT_INSTANCE_TYPE,
  [AWS_STEPS.SELECT_INSTANCE_TYPE]: AWS_STEPS.CREATE_INSTANCE,
  [AWS_STEPS.CREATE_INSTANCE]: AWS_STEPS.INSTANCE_IP,
  [AWS_STEPS.INSTANCE_IP]: AWS_STEPS.CREATE_MIRROR_TARGET,
  [AWS_STEPS.CREATE_MIRROR_TARGET]: AWS_STEPS.CREATE_MIRROR_FILTER,
  [AWS_STEPS.CREATE_MIRROR_FILTER]: AWS_STEPS.CREATE_MIRROR_SESSION,
  [AWS_STEPS.CREATE_MIRROR_SESSION]: AWS_STEPS.TEST_SSH,
  [AWS_STEPS.TEST_SSH]: AWS_STEPS.PUSH_FILES,
  [AWS_STEPS.PUSH_FILES]: AWS_STEPS.EXEC_COMMAND,
  [AWS_STEPS.EXEC_COMMAND]: null,
}

export const AWS_STEP_TO_TITLE_MAP: Record<AWS_STEPS, string> = {
  [AWS_STEPS.AWS_KEY_SETUP]: "AWS Credentials Setup",
  [AWS_STEPS.SOURCE_INSTANCE_ID]: "EC2 Instance for mirroring source",
  [AWS_STEPS.SELECT_OS]: "OS Selection",
  [AWS_STEPS.SELECT_INSTANCE_TYPE]: "EC2 Instance type selection",
  [AWS_STEPS.CREATE_INSTANCE]: "EC2 Instance Instantiation",
  [AWS_STEPS.INSTANCE_IP]: "Obtain Mirror Instance IP",
  [AWS_STEPS.CREATE_MIRROR_TARGET]: "Traffic Mirror Target Creation",
  [AWS_STEPS.CREATE_MIRROR_FILTER]: "Traffic Mirror Filter Creation",
  [AWS_STEPS.CREATE_MIRROR_SESSION]: "Traffic Mirror Session Creation",
  [AWS_STEPS.TEST_SSH]: "SSH Connection Test",
  [AWS_STEPS.PUSH_FILES]: "Push installation files to remote instance",
  [AWS_STEPS.EXEC_COMMAND]: "Install metlo",
}

export const GCP_STEP_TO_TITLE_MAP: Record<GCP_STEPS, string> = {
  [GCP_STEPS.GCP_KEY_SETUP]: "GCP Credentials Setup",
  [GCP_STEPS.SOURCE_INSTANCE_ID]: "GCP Mirrored Instance Sselection",
  [GCP_STEPS.CREATE_DESTINATION_SUBNET]: "Destination Subnet Creation",
  [GCP_STEPS.CREATE_FIREWALL]: "GCP Firewall creation",
  [GCP_STEPS.CREATE_CLOUD_ROUTER]: "GCP Cloud Router Creation for Collector",
  [GCP_STEPS.CREATE_MIG]: "GCP Collector Instance Creation",
  // [GCP_STEPS.PUSH_KEY]: "SSH Key Creation",
  [GCP_STEPS.CREATE_HEALTH_CHECK]: "Collector Health Check Creation",
  [GCP_STEPS.CREATE_BACKEND_SERVICE]: "GCP Packet Routing Service Creation",
  [GCP_STEPS.CREATE_ILB]: "Internal Load Balancer Creation",
  [GCP_STEPS.START_PACKET_MIRRORING]: "Start Data Mirroring",
  [GCP_STEPS.TEST_SSH]: "SSH Connection Test",
  [GCP_STEPS.PUSH_FILES]: "Push installation files to remote instance",
  [GCP_STEPS.EXEC_COMMAND]: "Install metlo",
}

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
}

export const ATTACK_TYPE_TO_RISK_SCORE: Record<AttackType, RiskScore> = {
  [AttackType.HIGH_ERROR_RATE]: RiskScore.HIGH,
  [AttackType.ANOMALOUS_CALL_ORDER]: RiskScore.MEDIUM,
  [AttackType.BOLA]: RiskScore.HIGH,
  [AttackType.HIGH_USAGE_SENSITIVE_ENDPOINT]: RiskScore.HIGH,
  [AttackType.UNAUTHENTICATED_ACCESS]: RiskScore.HIGH,
}