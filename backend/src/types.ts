import { ApiEndpoint } from "../models";
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

export interface UpdatePIIFieldParams {
  isRisk: boolean;
}

export interface AlertResponse {
  uuid: string;
  type: AlertType;
  riskScore: RiskScore;
  apiEndpointUuid: string;
  apiEndpoint: ApiEndpoint;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  resolutionMessage: string;
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
