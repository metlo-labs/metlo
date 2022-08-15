export enum RestMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
}

export enum DataClass {
  EMAIL = "Email",
  CREDIT_CARD = "Credit Card Number",
  SSN = "Social Security Number",
  PHONE_NUMBER = "Phone Number",
  IP_ADDRESS = "IP Address",
  COORDINATE = "Geographic Coordinates",
  VIN = "Vehicle Identification Number",
  ADDRESS = "Address",
  DOB = "Date of Birth",
  DL_NUMBER = "Driver License Number",
}

export enum RiskScore {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum AlertType {
  NEW_ENDPOINT = "New Endpoint Detected",
  PII_DATA_DETECTED = "PII Data Detected",
  OPEN_API_SPEC_DIFF = "Open API Spec Diff",
  UNDOCUMENTED_ENDPOINT = "Undocumented Endpoint",
}

export enum ConnectionType {
  AWS = "AWS",
  GCP = "GCP",
}

export enum SpecExtension {
  JSON = "json",
  YAML = "yaml",
}

export enum STEPS {
  // SETUP MIRROR INSTANCE
  AWS_KEY_SETUP = 1,
  SOURCE_INSTANCE_ID = 2,
  SELECT_OS = 3,
  SELECT_INSTANCE_TYPE = 4,
  CREATE_INSTANCE = 5,
  INSTANCE_IP = 6,
  CREATE_MIRROR_TARGET = 7,
  CREATE_MIRROR_FILTER = 8,
  CREATE_MIRROR_SESSION = 9,
  TEST_SSH = 10,
  PUSH_FILES = 11,
  EXEC_COMMAND = 12,
}

export enum protocols {
  TCP = 6,
  UDP = 17,
}
