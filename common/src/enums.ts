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
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum AlertType {
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
