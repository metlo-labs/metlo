import { AlertType, RestMethod, RiskScore } from "./enums";

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

export interface SummaryResponse {
  highRiskAlerts: number;
  newAlerts: number;
  endpointsTracked: number;
  piiDataFields: number;
}

export interface IsRiskParams {
  isRisk: boolean;
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;
