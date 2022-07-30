export enum RiskScore {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

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
}
