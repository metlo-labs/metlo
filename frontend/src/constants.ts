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
