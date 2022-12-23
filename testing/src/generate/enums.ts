export enum DataType {
  INTEGER = "integer",
  NUMBER = "number",
  STRING = "string",
  BOOLEAN = "boolean",
  OBJECT = "object",
  ARRAY = "array",
  UNKNOWN = "unknown",
}

export enum DataSection {
  REQUEST_PATH = "reqPath",
  REQUEST_QUERY = "reqQuery",
  REQUEST_HEADER = "reqHeaders",
  REQUEST_BODY = "reqBody",
  RESPONSE_HEADER = "resHeaders",
  RESPONSE_BODY = "resBody",
}

export enum AuthType {
  BASIC = "basic",
  HEADER = "header",
  JWT = "jwt",
  SESSION_COOKIE = "session_cookie",
}
