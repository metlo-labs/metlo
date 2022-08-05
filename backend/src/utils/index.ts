import validator from "validator";
import { pathParameterRegex } from "../constants";

export const isSuspectedParamater = (value: string) => {
  if (!isNaN(Number(value))) {
    return true;
  }
  if (validator.isUUID(value)) {
    return true;
  }
  return false;
};

export const getPathRegex = (path: string) => {
  return path.replace(pathParameterRegex, String.raw`/[^/]+`);
}
