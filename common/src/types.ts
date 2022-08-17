import {
  AlertType,
  ConnectionType,
  protocols,
  RestMethod,
  RiskScore,
  SpecExtension,
  STEPS,
} from "./enums";

export interface Meta {
  incoming: boolean;
  source: string;
  sourcePort: string;
  destination: string;
  destinationPort: string;
}

export interface PairObject {
  name: string;
  value: string;
}

export interface Url {
  host: string;
  path: string;
  parameters: PairObject[];
}

export interface Request {
  url: Url;
  headers: PairObject[];
  body: string;
  method: RestMethod;
}

export interface Response {
  status: number;
  headers: PairObject[];
  body: string;
}

export interface TraceParams {
  request: Request;
  response: Response;
  meta: Meta;
}

export interface GetEndpointParams {
  hosts?: string[];
  riskScores?: RiskScore[];
  offset?: number;
  limit?: number;
}

export interface GetAlertParams {
  riskScores?: RiskScore[];
  resolved?: boolean;
  alertTypes?: AlertType[];
  offset?: number;
  limit?: number;
}

export interface UpdatePIIFieldParams {
  isRisk: boolean;
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export interface ApiTrace {
  uuid: string;
  path: string;
  createdAt: Date;
  host: string;
  method: RestMethod;
  requestParameters: PairObject[];
  requestHeaders: PairObject[];
  requestBody: string;
  responseStatus: number;
  responseHeaders: PairObject[];
  responseBody: string;
  meta: Meta;
  apiEndpointUuid: string;
}

export interface Alert {
  uuid: string;
  type: AlertType;
  riskScore: RiskScore;
  apiEndpointUuid: string;
  apiEndpoint: ApiEndpoint;
  description: string[];
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  resolutionMessage: string;
}

export interface PIIField {
  uuid: string;
  dataClass: string;
  dataPath: string;
  createdAt: Date;
  updatedAt: Date;
  matches: string[];
  isRisk: boolean;
  apiEndpointUuid: string;
}

export interface ApiEndpoint {
  uuid: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  firstDetected?: Date;
  lastActive?: Date;
  host: string;
  totalCalls: number;
  method: RestMethod;
  owner: string;
  riskScore: RiskScore;
  openapiSpecName: string;
}

export interface ApiEndpointDetailed extends ApiEndpoint {
  sensitiveDataClasses: PIIField[];
  openapiSpec: OpenApiSpec;
  alerts: Alert[];
  traces: ApiTrace[];
}

export interface OpenApiSpec {
  name: string;
  spec: string;
  isAutoGenerated: boolean;
  extension: SpecExtension;
  createdAt: Date;
  updatedAt: Date;
  hosts: string[];
}

export interface Connection {
  createdAt: Date;
  uuid: string;
  name: string;
  type: ConnectionType;
}

export interface Summary {
  highRiskAlerts: number;
  newAlerts: number;
  endpointsTracked: number;
  piiDataFields: number;
}

export interface Usage {
  date: Date;
  count: number;
}

export interface STEP_RESPONSE {
  success: "OK" | "FAIL";
  status: "STARTED" | "COMPLETE" | "IN-PROGRESS";
  next_step: STEPS;
  step_number: STEPS;
  last_completed: STEPS;
  message: string;
  error?: {
    err: string;
  };
  data: Partial<AWS_CONNECTION & AWS_CONNECTION_MISC>;
  returns?: {
    os_types?: [{ name: string; ami: string }];
    instance_types?: string[];
  };
}

export interface MachineSpecifications {
  minCpu: number;
  maxCpu: number;
  minMem: number;
  maxMem?: number;
}

export interface TrafficFilterRuleSpecs {
  destination_CIDR: string;
  source_CIDR: string;
  source_port?: string;
  destination_port?: string;
  protocol: protocols;
  direction: "out" | "in";
}

export interface AWS_CONNECTION {
  secret_access_key: string;
  access_id: string;
  source_instance_id: string;
  region: string;
  ami: string;
  selected_instance_type: string;
  mirror_instance_id: string;
  mirror_target_id: string;
  mirror_filter_id: string;
  mirror_session_id: string;
  mirror_rules: Array<TrafficFilterRuleSpecs>;
  keypair: string;
  destination_eni_id: string;
  backend_url: string;
  remote_machine_url: string;
}

export interface AWS_CONNECTION_MISC {
  instance_types: string[];
  virtualization_type: string;
  machine_specs: MachineSpecifications;
}

export interface ENCRYPTED_AWS_CONNECTION__META {
  keypair_tag: string;
  keypair_iv: string;
  secret_access_key_tag: string;
  secret_access_key_iv: string;
  access_id_tag: string;
  access_id_iv: string;
}

export interface ConnectionInfo {
  uuid: string;
  connectionType: ConnectionType;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  aws?: Omit<AWS_CONNECTION, "secret_access_key" | "access_id" | "keypair">;
}
