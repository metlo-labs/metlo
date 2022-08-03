import { TraceParams } from "../../common/dist/types";
import { RiskScore } from "../../common/dist/enums";

export interface PIIField {
  dataType: string;
  dataPath: string;
  risk: RiskScore;
  dateIdentified: string;
}

export interface Endpoint {
  uuid: string;
  environment: string;
  host: string;
  path: string;
  method: string;
  riskScore: RiskScore;
  firstDetected: string;
  lastActive: string;
  piiData: PIIField[];
  traces: TraceParams[];
}
