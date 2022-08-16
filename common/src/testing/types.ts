import { RestMethod } from "../enums";
import { APIKeyAuthAddTo, AuthType, RequestBodyType } from "./enums";

export interface AuthAPIKeyParams {
  key: string;
  value: string;
  add_to: APIKeyAuthAddTo;
}

export interface AuthBasicAuthParams {
  username: string;
  password: string;
}

export interface Authorization {
  type: AuthType;
  params: AuthAPIKeyParams | AuthBasicAuthParams;
}

interface DataPair {
  key: string;
  value: string;
  description?: string;
}

export type QueryParam = DataPair;
export type Header = DataPair;

export type RequestBodyDataTypeNone = null;
export type RequestBodyDataTypeRaw = string;
export type RequestBodyDataTypeFormData = DataPair[];

export interface RequestBody {
  type: RequestBodyType;
  data:
    | RequestBodyDataTypeNone
    | RequestBodyDataTypeRaw
    | RequestBodyDataTypeFormData;
}

export interface Result {
  body: string;
  cookies: string;
  headers: Header[];
}

export interface Request {
  name?: string;
  method: RestMethod;
  url: string;
  authorization: Authorization;
  params: QueryParam[];
  headers: Header[];
  body: RequestBody;
  tests: string;
  result?: Result;
}

export interface Test {
  name: string;
  tags: string[];
  requests: Request[];
}
