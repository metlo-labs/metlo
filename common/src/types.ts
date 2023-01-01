import {
  AlertType,
  ConnectionType,
  __DataClass_INTERNAL__,
  DataSection,
  DataTag,
  DataType,
  RestMethod,
  RiskScore,
  SpecExtension,
  Status,
  AuthType,
  AttackType,
  API_KEY_TYPE,
  DisableRestMethod,
} from "./enums"
import "axios"
import { TestConfig } from "@metlo/testing"

export interface Meta {
  incoming: boolean
  source: string
  sourcePort: string
  destination: string
  destinationPort: string
}

export interface SessionMeta {
  authenticationProvided: boolean
  authenticationSuccessful: boolean
  authType: AuthType
  uniqueSessionKey?: string
  user?: string
}

export interface PairObject {
  name: string
  value: string
}

export interface Url {
  host: string
  path: string
  parameters: PairObject[]
}

declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: Record<string, any>
  }
  interface AxiosResponseConfig {
    metadata?: Record<string, any>
  }
  interface AxiosResponse {
    duration?: number
  }
}

export interface Request {
  url: Url
  headers: PairObject[]
  body: string
  method: RestMethod
}

export interface Response {
  status: number
  headers: PairObject[]
  body: string
}

export interface TraceParams {
  request: Request
  response: Response
  meta: Meta
}

export interface GetSensitiveDataAggParams {
  hosts?: string[]
  riskScores?: RiskScore[]
  locations?: DataSection[]
}

export interface GetVulnerabilityAggParams {
  hosts?: string[]
  riskScores?: RiskScore[]
}

export interface GetAttackParams {
  hosts?: string[]
  riskScores?: RiskScore[]
  offset?: number
  limit?: number
}

export interface GetEndpointParams {
  hosts?: string[]
  riskScores?: RiskScore[]
  dataClasses?: string[]
  searchQuery?: string
  isAuthenticated?: boolean
  offset?: number
  limit?: number
}

export interface GetHostParams {
  offset?: number
  limit?: number
  searchQuery?: string
}

export interface UpdateDataFieldClassesParams {
  dataClasses: string[]
  dataSection: DataSection
  dataPath: string
}

export interface UpdateDataFieldParams {
  isRisk: boolean
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>

export interface QueuedApiTrace {
  path: string
  createdAt: Date
  host: string
  method: RestMethod
  requestParameters: PairObject[]
  requestHeaders: PairObject[]
  requestBody: string
  responseStatus: number
  responseHeaders: PairObject[]
  responseBody: string
  meta: Meta
  sessionMeta: SessionMeta
}

export interface ApiTrace extends QueuedApiTrace {
  uuid: string
  apiEndpointUuid: string
}

export interface Alert {
  uuid: string
  type: AlertType
  riskScore: RiskScore
  apiEndpointUuid: string
  apiEndpoint: {
    uuid: string
    method: RestMethod
    host: string
    path: string
    openapiSpecName: string
    openapiSpec: {
      extension: SpecExtension
      minimizedSpecContext: Record<string, MinimizedSpecContext>
    }
  }
  description: string
  createdAt: Date
  updatedAt: Date
  status: Status
  resolutionMessage: string
  context: object
}

export interface DataField {
  uuid: string
  dataClasses: string[]
  dataPath: string
  dataSection: DataSection
  dataType: DataType
  dataTag: DataTag
  falsePositives: string[]
  scannerIdentified: string[]
  createdAt: Date
  updatedAt: Date
  matches: Record<string, string[]>
  apiEndpointUuid: string
  statusCode: number
  contentType: string
  isNullable: boolean
  arrayFields: Record<string, number>
}

export interface ApiEndpoint {
  uuid: string
  path: string
  createdAt: Date
  updatedAt: Date
  dataClasses?: string[]
  firstDetected?: Date
  lastActive?: Date
  host: string
  method: RestMethod
  owner: string
  riskScore: RiskScore
  openapiSpecName: string
  isAuthenticatedDetected: boolean
  isAuthenticatedUserSet: boolean
  isGraphQl: boolean
}

export interface ApiEndpointDetailed extends ApiEndpoint {
  openapiSpec: OpenApiSpec
  alerts: Alert[]
  traces: ApiTrace[]
  tests: any[]
  dataFields: DataField[]
}

export interface HostResponse {
  host: string
  numEndpoints: number
}

export interface OpenApiSpec {
  name: string
  spec: string
  isAutoGenerated: boolean
  extension: SpecExtension
  createdAt: Date
  updatedAt: Date
  hosts: string[]
  specUpdatedAt: Date
}

export interface Connection {
  createdAt: Date
  uuid: string
  name: string
  type: ConnectionType
}

export interface EndpointAndUsage extends ApiEndpointDetailed {
  last30MinCnt: number
  last5MinCnt: number
  last1MinCnt: number
}

export interface UsageStats {
  dailyUsage: { day: string; cnt: number }[]
  last1MinCnt: number
  last60MinCnt: number
}

export interface Summary {
  highRiskAlerts: number
  newAlerts: number
  endpointsTracked: number
  piiDataFields: number
  hostCount: number
  piiDataTypeCount: Map<string, number>
  alertTypeCount: Map<AlertType, number>
  topAlerts: Alert[]
  topEndpoints: EndpointAndUsage[]
  usageStats: UsageStats
  numConnections: number
}

export interface Usage {
  date: Date
  count: number
}

export interface PIIDataClassAggItem {
  dataClass: string
  risk: RiskScore
  count: number
  numEndpoints: number
  numHosts: number
}

export interface SensitiveDataSummary {
  piiDataTypeCount: Map<string, number>
  piiItems: PIIDataClassAggItem[]
  totalPIIFields: number
  totalEndpoints: number
}

export interface VulnerabilityAggItem {
  type: AlertType
  risk: RiskScore
  count: number
  numEndpoints: number
  numHosts: number
}

export interface VulnerabilitySummary {
  vulnerabilityTypeCount: Map<AlertType, number>
  vulnerabilityItems: VulnerabilityAggItem[]
  totalVulnerabilities: number
  totalEndpoints: number
}

export interface AttackMeta {
  averageRPS?: number
  currentRPS?: number
}

export interface Attack {
  uuid: string
  createdAt: Date
  riskScore: RiskScore
  attackType: AttackType
  description: string
  metadata: AttackMeta
  startTime: Date
  endTime: Date

  uniqueSessionKey: string
  sourceIP: string
  apiEndpointUuid: string
  apiEndpoint: ApiEndpoint
  host: string

  resolved: boolean
  snoozed: boolean
  snoozeHours: number
}

export interface AttackResponse {
  attackTypeCount: Record<AttackType, number>
  attacks: Attack[]
  totalAttacks: number
  totalEndpoints: number
  validLicense: boolean
}

export interface AttackDetailResponse {
  attack: Attack
  traces: ApiTrace[]
  validLicense: boolean
}

export interface InstanceSettings {
  uuid: string
  updateEmail: string
  skippedUpdateEmail: boolean
}

export interface MinimizedSpecContext {
  lineNumber: number
  minimizedSpec: string
}

export interface ApiKey {
  name: string
  identifier: string
  created: string
  for: API_KEY_TYPE
}

export interface AuthenticationConfig {
  host: string
  authType: AuthType
  headerKey: string
  jwtUserPath: string
  cookieName: string
}

export interface DisabledPathSection {
  reqQuery: string[]
  reqHeaders: string[]
  reqBody: string[]
  resHeaders: string[]
  resBody: string[]
}

export interface BlockFieldEntry {
  path: string
  pathRegex: string
  method: DisableRestMethod
  numberParams: number
  disabledPaths: DisabledPathSection
}

export interface UpdateMetloConfigParams {
  configString: string
}

export interface MetloConfigResp {
  uuid: string
  configString: string
}

export interface WebhookRun {
  ok: boolean
  msg: string
  payload: Alert
}

export interface WebhookResp {
  uuid: string
  createdAt: Date
  url: string
  maxRetries: number
  alertTypes: AlertType[]
  hosts: string[]
  runs: WebhookRun[]
}

export interface CreateWebhookParams {
  url: string
  alertTypes: AlertType[]
  hosts: string[]
}

export interface HostGraph {
  hosts: { [key: string]: { numEndpoints: number } }
  edges: {
    srcHost: string
    dstHost: string
    numEndpoints: number
  }[]
}

export interface GenerateTestParams {
  type: string
  endpoint: string
  version?: number
  host?: string
}

export interface GenerateTestRes {
  success: boolean
  templateName?: string,
  templateVersion?: number,
  msg?: string
  test?: TestConfig
}

export interface DataClass {
  className: string,
  severity: RiskScore,
  regex?: string
}