import validator from "validator";

export const isSuspectedParamater = (value: string) => {
  if (!isNaN(Number(value))) {
    return true;
  }
  if (validator.isUUID(value)) {
    return true;
  }
  return false;
};
