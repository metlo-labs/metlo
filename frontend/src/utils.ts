import { DateTime } from "luxon";
import { RiskScore, DataClass } from "@common/enums";
import { RISK_SCORE_ORDER, DATA_CLASS_TO_RISK_SCORE } from "./constants";

export const getDateTimeString = (date: Date) => {
  if (date) {
    return DateTime.fromISO(date.toString()).toLocaleString(
      DateTime.DATETIME_MED
    );
  }
  return null;
};

export const getRiskScores = (dataClasses: DataClass[]) =>
  dataClasses?.map((dataClass) => DATA_CLASS_TO_RISK_SCORE[dataClass]);

export const getMaxRiskScoreFromList = (riskScores: RiskScore[]): RiskScore => {
  let maxRisk = RiskScore.NONE;
  for (let i = 0; i < riskScores?.length; i++) {
    if (RISK_SCORE_ORDER[riskScores[i]] > RISK_SCORE_ORDER[maxRisk]) {
      maxRisk = riskScores[i];
    }
  }
  return maxRisk;
};
