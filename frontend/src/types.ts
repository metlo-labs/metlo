export enum RiskScore {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface Endpoint {
  uuid: string;
  environment: string;
  host: string;
  path: string;
  method: string;
  riskScore: RiskScore;
  firstDetected: Date;
  lastActive: Date;
}
