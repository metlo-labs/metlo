import { ApiEndpoint } from "models/api-endpoint"
import { DataField } from "models/data-field"
import { ApiTrace } from "models/api-trace"
import { OpenApiSpec } from "models/openapi-spec"
import { Alert } from "models/alert"
import { Session } from "models/sessions"
import { Connections } from "./connections"
import { ApiEndpointTest } from "./api-endpoint-test"
import { ApiKey } from "./keys"
import { BlockFields } from "./block-fields"
import { InstanceSettings } from "./instance-settings"
import { AuthenticationConfig } from "./authentication-config"
import { AggregateTraceDataHourly } from "./aggregate-trace-data-hourly"
import { Attack } from "./attack"
import { Webhook } from "./webhook"
import { TestingConfig } from "./testing-config"
import { Hosts } from "./hosts"
import { GQLSchema } from "./gql-schema"

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
  | BlockFields
  | InstanceSettings
  | AuthenticationConfig
  | AggregateTraceDataHourly
  | Attack
  | Webhook
  | TestingConfig
  | Hosts
  | GQLSchema

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
  BlockFields,
  InstanceSettings,
  AuthenticationConfig,
  AggregateTraceDataHourly,
  Attack,
  Webhook,
  TestingConfig,
  Hosts,
  GQLSchema,
}
