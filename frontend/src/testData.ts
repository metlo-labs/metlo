import { RiskScore } from "./types";

export const testEndpoints = [
  {
    uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    environment: "production",
    host: "AWS Gateway 1",
    path: "/foo/bar/{test}",
    method: "POST",
    riskScore: RiskScore.HIGH,
    firstDetected: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
  {
    uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    environment: "production",
    host: "AWS Gateway 1",
    path: "/foo/bar/{test}",
    method: "POST",
    riskScore: RiskScore.MEDIUM,
    firstDetected: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
];
