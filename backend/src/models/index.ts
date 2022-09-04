import { ApiEndpoint } from "models/api-endpoint"
import { DataField } from "models/data-field"
import { ApiTrace } from "models/api-trace"
import { OpenApiSpec } from "models/openapi-spec"
import { Alert } from "models/alert"
import { Session } from "models/sessions"
import { Connections } from "./connections"
import { ApiEndpointTest } from "./api-endpoint-test"
import { ApiKey } from "./keys"

export type DatabaseModel =
  | ApiEndpoint
  | DataField
  | ApiTrace
  | OpenApiSpec
  | Alert
  | Session
  | Connections
  | ApiEndpointTest
  | ApiKey

export {
  ApiEndpoint,
  DataField,
  ApiTrace,
  OpenApiSpec,
  Alert,
  Session,
  Connections,
  ApiEndpointTest,
  ApiKey,
}
