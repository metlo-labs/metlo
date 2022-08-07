import { RiskScore } from "@common/enums";

export const METHOD_TO_COLOR = {
  GET: "green",
  POST: "orange",
};

export const RISK_TO_COLOR = {
  [RiskScore.LOW]: "gray",
  [RiskScore.MEDIUM]: "orange",
  [RiskScore.HIGH]: "red",
};

export const API_URL = "http://localhost:3000/api/v1";

export const ENDPOINT_PAGE_LIMIT = 10;
