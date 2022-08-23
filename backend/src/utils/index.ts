import validator from "validator";
import { DataField } from "models";
import { pathParameterRegex } from "~/constants";
import { DataType, RiskScore } from "@common/enums";

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

export const getRiskScore = (dataFields: DataField[]): RiskScore => {
  if (!dataFields) {
    return RiskScore.NONE;
  }
  let numRiskySensitiveDataClasses = 0;
  for (const dataField of dataFields) {
    if (dataField.dataClass !== null && dataField.isRisk) {
      numRiskySensitiveDataClasses += 1;
    }
  }
  switch (true) {
    case numRiskySensitiveDataClasses >= 3:
      return RiskScore.HIGH;
    case numRiskySensitiveDataClasses >= 2:
      return RiskScore.MEDIUM;
    case numRiskySensitiveDataClasses >= 1:
      return RiskScore.LOW;
    default:
      return RiskScore.NONE;
  }
};

export const getDataType = (data: any): DataType => {
  if (data === undefined || data === null) {
    return null;
  }
  if (typeof data === "boolean") {
    return DataType.BOOLEAN;
  }
  if (Number(data)) {
    if (Number.isInteger(Number(data))) {
      return DataType.INTEGER;
    }
    return DataType.NUMBER;
  }
  if (Array.isArray(data)) {
    return DataType.ARRAY;
  }
  if (typeof data === "object") {
    return DataType.OBJECT;
  }
  return DataType.STRING;
};

export const parsedJson = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    return null;
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
