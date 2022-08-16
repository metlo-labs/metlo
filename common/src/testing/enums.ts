export enum AuthType {
  API_KEY = "API Key",
  BASIC_AUTH = "Basic Auth",
}

export enum APIKeyAuthAddTo {
  HEADERS = "Headers",
  QUERY_PARAMS = "Query Params",
}

export enum RequestBodyType {
    NONE = "None",
    RAW = "Raw",
    FORM_DATA = "Form Data"
}
