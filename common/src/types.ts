import { RestMethod } from "./enums";

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
