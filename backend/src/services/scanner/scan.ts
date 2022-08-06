import { DataClass } from "../../enums";
import {
  ADDRESS_REGEXP,
  COORDINATE_REGEXP,
  CREDIT_CARD_REGEXP,
  DOB_REGEXP,
  DRIVER_LICENSE_REGEXP,
  EMAIL_REGEXP,
  IP_ADDRESS_REGEXP,
  PHONE_NUMBER_REGEXP,
  SSN_REGEXP,
  VIN_REGEXP,
} from "./regexp";
import { PairObject } from "../../types";
import { ApiEndpoint, MatchedDataClass } from "../../../models";
import { AppDataSource } from "../../data-source";

const DATA_CLASS_REGEX_MAP = new Map<DataClass, RegExp>([
  [DataClass.ADDRESS, ADDRESS_REGEXP],
  [DataClass.DL_NUMBER, DRIVER_LICENSE_REGEXP],
  [DataClass.COORDINATE, COORDINATE_REGEXP],
  [DataClass.CREDIT_CARD, CREDIT_CARD_REGEXP],
  [DataClass.DOB, DOB_REGEXP],
  [DataClass.EMAIL, EMAIL_REGEXP],
  [DataClass.IP_ADDRESS, IP_ADDRESS_REGEXP],
  [DataClass.PHONE_NUMBER, PHONE_NUMBER_REGEXP],
  [DataClass.SSN, SSN_REGEXP],
  [DataClass.VIN, VIN_REGEXP],
]);

export class ScannerService {
  static matchExists(
    matchedDataClasses: MatchedDataClass[],
    dataPath: string,
    dataClass: DataClass
  ): boolean {
    for (let i = 0; i < matchedDataClasses.length; i++) {
      const curr = matchedDataClasses[i];
      if (curr.dataClass === dataClass && curr.dataPath === dataPath) {
        return true;
      }
    }
    return false;
  }

  static async saveMatch(
    matchDataClass: DataClass,
    matchDataPath: string,
    apiEndpoint: ApiEndpoint,
    matches: Record<DataClass, string[]>
  ) {
    const existingMatch = this.matchExists(
      apiEndpoint.sensitiveDataClasses,
      matchDataPath,
      matchDataClass
    );
    if (!existingMatch) {
      const dataClass = new MatchedDataClass();
      dataClass.dataClass = matchDataClass;
      dataClass.dataPath = matchDataPath;
      dataClass.matches = matches[matchDataClass];
      dataClass.apiEndpoint = apiEndpoint;
      await AppDataSource.getRepository(MatchedDataClass).save(dataClass);
    }
  }

  static parsedJson(jsonString: string) {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return null;
    }
  }

  static recursiveParseJson(
    dataPathPrefix: string,
    jsonBody: any,
    apiEndpoint: ApiEndpoint
  ) {
    if (typeof jsonBody === "object") {
      for (let key in jsonBody) {
        this.recursiveParseJson(
          `${dataPathPrefix}.${key}`,
          jsonBody[key],
          apiEndpoint
        );
      }
    } else {
      const matches = this.scan(jsonBody);
      Object.keys(matches).forEach(async (match) => {
        const matchDataClass = match as DataClass;
        await this.saveMatch(
          matchDataClass,
          dataPathPrefix,
          apiEndpoint,
          matches
        );
      });
    }
  }

  static findMatchedDataClassesBody(
    dataPathPrefix: string,
    body: string,
    apiEndpoint: ApiEndpoint
  ) {
    if (body) {
      const jsonBody = this.parsedJson(body);
      if (jsonBody) {
        let dataPath = `${dataPathPrefix}.json`;
        for (let key in jsonBody) {
          this.recursiveParseJson(
            `${dataPath}.${key}`,
            jsonBody[key],
            apiEndpoint
          );
        }
      } else {
        const dataPath = `${dataPathPrefix}.text`;
        const matches = this.scan(body);
        Object.keys(matches).forEach(async (match) => {
          const matchDataClass = match as DataClass;
          await this.saveMatch(matchDataClass, dataPath, apiEndpoint, matches);
        });
      }
    }
  }

  static findMatchedDataClasses(
    dataPathPrefix: string,
    data: PairObject[],
    apiEndpoint: ApiEndpoint
  ) {
    if (data) {
      for (const item of data) {
        const field = item.name;
        const matches = this.scan(item.value);
        Object.keys(matches).forEach(async (match) => {
          const matchDataClass = match as DataClass;
          const matchDataPath = `${dataPathPrefix}.${field}`;
          await this.saveMatch(
            matchDataClass,
            matchDataPath,
            apiEndpoint,
            matches
          );
        });
      }
    }
  }

  static scan = (text: string) => {
    const res: Record<DataClass, string[]> = {} as Record<DataClass, string[]>;
    DATA_CLASS_REGEX_MAP.forEach((exp, dataClass) => {
      const matches = text.match(exp);
      if (matches?.length > 0) {
        res[dataClass] = matches;
      }
    });
    return res;
  };
}
