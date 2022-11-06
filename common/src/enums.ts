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

export enum DisableRestMethod {
  GET = "GET",
  HEAD = "HEAD",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  CONNECT = "CONNECT",
  OPTIONS = "OPTIONS",
  TRACE = "TRACE",
  ALL = "ALL",
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

export enum DataTag {
  PII = "PII",
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
  QUERY_SENSITIVE_DATA = "Sensitive Data in Query Params",
  PATH_SENSITIVE_DATA = "Sensitive Data in Path Params",
  BASIC_AUTHENTICATION_DETECTED = "Basic Authentication Detected",
  UNSECURED_ENDPOINT_DETECTED = "Endpoint not secured by SSL",
  UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA = "Unauthenticated Endpoint returning Sensitive Data",
}

export const VULNERABILITY_ALERT_TYPES = [
  AlertType.OPEN_API_SPEC_DIFF,
  AlertType.QUERY_SENSITIVE_DATA,
  AlertType.PATH_SENSITIVE_DATA,
  AlertType.BASIC_AUTHENTICATION_DETECTED,
  AlertType.UNSECURED_ENDPOINT_DETECTED,
  AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA,
]

export enum AttackType {
  HIGH_USAGE_SENSITIVE_ENDPOINT = "High Usage on Sensitive Endpoint",
  HIGH_ERROR_RATE = "High Error Rate",
  ANOMALOUS_CALL_ORDER = "Anomalous Call Order",
  UNAUTHENTICATED_ACCESS = "Unauthenticated Access",
  BOLA = "Broken Object Level Authorization",
}

export enum ConnectionType {
  AWS = "AWS",
  GCP = "GCP",
  PYTHON = "PYTHON",
  NODE = "NODE",
  JAVA = "JAVA",
  KUBERNETES = "KUBERNETES"
}

export enum SpecExtension {
  JSON = "json",
  YAML = "yaml",
}

export enum AWS_STEPS {
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

export enum GCP_STEPS {
  GCP_KEY_SETUP = 1, // Get key, region, network
  SOURCE_INSTANCE_ID = 2, // Get GCP Source Instance ID/Name. Also get subnet info from that
  CREATE_DESTINATION_SUBNET = 3, // Reserve an Address, use that to create subnet from that and delete address
  CREATE_FIREWALL = 4, // Create firewall targeting certain things, say tags, also create rules
  CREATE_CLOUD_ROUTER = 5, // Includes creation of NAT
  CREATE_MIG = 6, // Create Image template and MIG in one step
  CREATE_HEALTH_CHECK = 7,
  CREATE_BACKEND_SERVICE = 8, // Also add health check to backend service
  CREATE_ILB = 9,
  START_PACKET_MIRRORING = 10,
  TEST_SSH = 11,
  PUSH_FILES = 12,
  EXEC_COMMAND = 13,
}

export enum protocols {
  TCP = 6,
  UDP = 17,
}

export enum DataType {
  INTEGER = "integer",
  NUMBER = "number",
  STRING = "string",
  BOOLEAN = "boolean",
  OBJECT = "object",
  ARRAY = "array",
  UNKNOWN = "unknown"
}

export enum DataSection {
  REQUEST_PATH = "reqPath",
  REQUEST_QUERY = "reqQuery",
  REQUEST_HEADER = "reqHeaders",
  REQUEST_BODY = "reqBody",
  RESPONSE_HEADER = "resHeaders",
  RESPONSE_BODY = "resBody",
}

export enum TestTags {
  BROKEN_OBJECT_LEVEL_AUTHORIZATION = "Broken Object Level Authorization",
  BROKEN_USER_AUTHENTICATION = "Broken User Authentication",
  BROKEN_FUNCTION_LEVEL_AUTHORIZATION = "Broken Function Level Authorization",
  MASS_ASSIGNMENT = "Mass Assignment",
  SECURITY_MISCONFIGURATION = "Security Misconfiguration",
}

export enum Status {
  RESOLVED = "Resolved",
  IGNORED = "Ignored",
  OPEN = "Open",
}

export enum UpdateAlertType {
  RESOLVE = "resolve",
  UNRESOLVE = "unresolve",
  IGNORE = "ignore",
  UNIGNORE = "unignore",
}

export enum AuthType {
  BASIC = "basic",
  HEADER = "header",
  JWT = "jwt",
  SESSION_COOKIE = "session_cookie",
}

export enum AWS_SOURCE_TYPE {
  INSTANCE,
  NETWORK_INTERFACE,
}

export enum GCP_SOURCE_TYPE {
  INSTANCE,
  SUBNET,
  TAG,
}

export enum API_KEY_TYPE {
  GCP = "GCP",
  AWS = "AWS",
  GENERIC = "GENERIC"
}

export enum OperationType {
  QUERY = "query",
  MUTATION = "mutation",
}
