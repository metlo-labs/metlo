import { DataClass, DataTag, DataType } from "@common/enums";
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
import { ApiEndpoint, ApiTrace, DataField } from "models";
import { getDataType, getRiskScore, parsedJson } from "utils";
import { AppDataSource } from "data-source";

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
  static async saveDataField(
    dataClass: DataClass,
    dataPath: string,
    apiEndpoint: ApiEndpoint,
    matches: string[],
    dataValue: any
  ): Promise<void> {
    const dataFieldRepository = AppDataSource.getRepository(DataField);
    const existingDataField = apiEndpoint.existingDataField(
      dataPath,
      dataClass
    );
    const dataType = getDataType(dataValue);
    if (!existingDataField) {
      const dataField = new DataField();
      dataField.dataClass = dataClass;
      dataField.dataPath = dataPath;
      dataField.dataType = dataType;
      if (matches.length > 0) {
        dataField.matches = matches;
        dataField.dataTag = DataTag.PII;
        dataField.isRisk = true;
      }
      apiEndpoint.addDataField(dataField);
    } else {
      let updated = false;
      if (existingDataField.dataClass === null && dataClass !== null) {
        existingDataField.dataClass = dataClass;
        existingDataField.matches = matches;
        existingDataField.dataTag = DataTag.PII;
        existingDataField.isRisk = true;
        updated = true;
      }
      if (existingDataField.dataType !== dataType) {
        existingDataField.dataType = dataType;
        updated = true;
      }

      if (updated) {
        await dataFieldRepository.save(existingDataField);
      }
    }
  }

  static async recursiveParseJson(
    dataPathPrefix: string,
    jsonBody: any,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (getDataType(jsonBody) === DataType.OBJECT) {
      for (let key in jsonBody) {
        this.recursiveParseJson(
          `${dataPathPrefix}.${key}`,
          jsonBody[key],
          apiEndpoint
        );
      }
    } else {
      const matches = this.scan(jsonBody);
      const matchesKeys = Object.keys(matches);
      if (matchesKeys.length > 0) {
        for (const match of matchesKeys) {
          const matchDataClass = match as DataClass;
          await this.saveDataField(
            matchDataClass,
            dataPathPrefix,
            apiEndpoint,
            matches[match],
            jsonBody
          );
        }
      } else {
        await this.saveDataField(null, dataPathPrefix, apiEndpoint, [], jsonBody);
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
          await this.recursiveParseJson(
            `${dataPath}.${key}`,
            jsonBody[key],
            apiEndpoint
          );
        }
      } else {
        const dataPath = `${dataPathPrefix}.text`;
        await this.recursiveParseJson(dataPath, body, apiEndpoint);
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
        await this.recursiveParseJson(
          `${dataPathPrefix}.${field}`,
          item.value,
          apiEndpoint
        );
        /*const matches = this.scan(item.value);
        for (const match of Object.keys(matches)) {
          const matchDataClass = match as DataClass;
          const matchDataPath = `${dataPathPrefix}.${field}`;
          await this.saveMatch(
            matchDataClass,
            matchDataPath,
            apiEndpoint,
            matches
          );
        }*/
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
    apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields);
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
