import validator from "validator";
import { ApiEndpoint } from "models";
import { pathParameterRegex } from "~/constants";
import { RiskScore } from "@common/enums";

export const isSuspectedParamater = (value: string): boolean => {
  if (!isNaN(Number(value))) {
    return true;
  }
  if (validator.isUUID(value)) {
    return true;
  }
  return false;
};

export const getPathRegex = (path: string): string => {
  return String.raw`^${path.replace(pathParameterRegex, String.raw`/[^/]+`)}$`;
};

export const getRiskScore = (endpoint: ApiEndpoint): RiskScore => {
  let numRiskySensitiveDataClasses = 0;
  for (let i = 0; i < endpoint.sensitiveDataClasses?.length; i++) {
    if (endpoint.sensitiveDataClasses[i].isRisk) {
      numRiskySensitiveDataClasses += 1;
    }
  }
  switch (true) {
    case numRiskySensitiveDataClasses >= 5:
      return RiskScore.HIGH;
    case numRiskySensitiveDataClasses >= 3:
      return RiskScore.MEDIUM;
    case numRiskySensitiveDataClasses >= 1:
      return RiskScore.LOW;
    default:
      return RiskScore.NONE;
  }
};

export const parsedJsonNonNull = (
  jsonString: string,
  returnString?: boolean
): any => {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    if (returnString) {
      return jsonString;
    }
    return {};
  }
};
