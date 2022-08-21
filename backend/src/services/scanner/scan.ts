import { DataClass } from "@common/enums";
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
} from "services/scanner/regexp";
import { PairObject } from "@common/types";
import { ApiEndpoint, ApiTrace, MatchedDataClass } from "models";
import { getRiskScore, parsedJson } from "utils";

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
    for (let i = 0; i < matchedDataClasses?.length; i++) {
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
  ): Promise<void> {
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
      dataClass.isRisk = true;
      apiEndpoint.addDataClass(dataClass);
    }
  }

  static async recursiveParseJson(
    dataPathPrefix: string,
    jsonBody: any,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
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
      for (const match of Object.keys(matches)) {
        const matchDataClass = match as DataClass;
        await this.saveMatch(
          matchDataClass,
          dataPathPrefix,
          apiEndpoint,
          matches
        );
      }
    }
  }

  static async findMatchedDataClassesBody(
    dataPathPrefix: string,
    body: string,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (body) {
      const jsonBody = parsedJson(body);
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
        for (const match of Object.keys(matches)) {
          const matchDataClass = match as DataClass;
          await this.saveMatch(matchDataClass, dataPath, apiEndpoint, matches);
        }
      }
    }
  }

  static async findMatchedDataClasses(
    dataPathPrefix: string,
    data: PairObject[],
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (data) {
      for (const item of data) {
        const field = item.name;
        const matches = this.scan(item.value);
        for (const match of Object.keys(matches)) {
          const matchDataClass = match as DataClass;
          const matchDataPath = `${dataPathPrefix}.${field}`;
          await this.saveMatch(
            matchDataClass,
            matchDataPath,
            apiEndpoint,
            matches
          );
        }
      }
    }
  }

  static async findAllMatchedDataClasses(
    apiTrace: ApiTrace,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    await this.findMatchedDataClasses(
      "req.params",
      apiTrace.requestParameters,
      apiEndpoint
    );
    await this.findMatchedDataClasses(
      "req.headers",
      apiTrace.requestHeaders,
      apiEndpoint
    );
    await this.findMatchedDataClasses(
      "res.headers",
      apiTrace.responseHeaders,
      apiEndpoint
    );
    await this.findMatchedDataClassesBody(
      "req.body",
      apiTrace.requestBody,
      apiEndpoint
    );
    await this.findMatchedDataClassesBody(
      "res.body",
      apiTrace.responseBody,
      apiEndpoint
    );
    apiEndpoint.riskScore = getRiskScore(apiEndpoint);
  }

  static scan(text: any): Record<DataClass, string[]> {
    const res: Record<DataClass, string[]> = {} as Record<DataClass, string[]>;
    if (typeof text !== "string") {
      return res;
    }
    DATA_CLASS_REGEX_MAP.forEach((exp, dataClass) => {
      const matches = text.match(exp);
      if (matches?.length > 0) {
        res[dataClass] = matches;
      }
    });
    return res;
  }
}
