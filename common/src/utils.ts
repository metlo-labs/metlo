import { RiskScore } from "./enums"

export const getPathTokens = (path: string): string[] => {
  if (!path) {
    return []
  }
  if (path === "/") {
    return ["/"]
  }
  const tokens = path.split("/")
  return tokens.filter(token => token.length > 0)
}

export const getHigherRiskScore = (
  riskScoreA: RiskScore,
  riskScoreB: RiskScore,
) => {
  if (riskScoreA == RiskScore.HIGH || riskScoreB == RiskScore.HIGH) {
    return RiskScore.HIGH
  }
  if (riskScoreA == RiskScore.MEDIUM || riskScoreB == RiskScore.MEDIUM) {
    return RiskScore.MEDIUM
  }
  if (riskScoreA == RiskScore.LOW || riskScoreB == RiskScore.LOW) {
    return RiskScore.LOW
  }
  return RiskScore.NONE
}
