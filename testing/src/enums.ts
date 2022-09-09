export enum AuthType {
  API_KEY = "API Key Auth",
  BASIC_AUTH = "Basic Auth",
  NO_AUTH = "No Auth",
  BEARER = "Bearer Auth",
}

export enum APIKeyAuthAddTo {
  HEADERS = "Headers",
  QUERY_PARAMS = "Query Params",
}

export enum RequestBodyType {
  NONE = "None",
  JSON = "JSON",
  FORM_DATA = "Form Data",
}

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