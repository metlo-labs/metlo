import { AppDataSource } from "data-source";
import Error500InternalServer from "errors/error-500-internal-server";
import { PairObject } from "@common/types";
import { DataClass, DataSection, DataTag, DataType } from "@common/enums";
import { ApiEndpoint, ApiTrace, DataField } from "models";
import { getDataType, getRiskScore, parsedJson } from "utils";
import { ScannerService } from "services/scanner/scan";

export class DataFieldService {
  static async updateIsRisk(
    isRisk: boolean,
    fieldId: string
  ): Promise<DataField> {
    const dataFieldRepository = AppDataSource.getRepository(DataField);
    const dataField = await dataFieldRepository.findOne({
      where: { uuid: fieldId },
    });
    if (!dataField.dataClass) {
      throw new Error500InternalServer(
        "Cannot update because data field is not identified as sensitive data."
      );
    }
    dataField.isRisk = isRisk;
    return await dataFieldRepository.save(dataField);
  }

  static async saveDataField(
    dataClass: DataClass,
    dataPath: string,
    dataSection: DataSection,
    apiEndpoint: ApiEndpoint,
    matches: string[],
    dataValue: any
  ): Promise<void> {
    const dataFieldRepository = AppDataSource.getRepository(DataField);
    const existingDataField = apiEndpoint.existingDataField(
      dataPath,
      dataClass,
      dataSection
    );
    const dataType = getDataType(dataValue);
    if (!existingDataField) {
      const dataField = new DataField();
      dataField.dataClass = dataClass;
      dataField.dataPath = dataPath;
      dataField.dataType = dataType;
      dataField.dataSection = dataSection;
      if (matches?.length > 0) {
        dataField.updateMatches(matches);
        dataField.dataTag = DataTag.PII;
        dataField.isRisk = true;
      }
      apiEndpoint.addDataField(dataField);
    } else {
      let updated = false;
      if (existingDataField.dataClass === null && dataClass !== null) {
        existingDataField.dataClass = dataClass;
        existingDataField.updateMatches(matches);
        existingDataField.dataTag = DataTag.PII;
        existingDataField.isRisk = true;
        updated = true;
      }
      if (existingDataField.dataType !== dataType) {
        existingDataField.dataType = dataType;
        updated = true;
      }
      if (matches?.length > 0) {
        updated = existingDataField.updateMatches(matches);
      }

      if (updated) {
        await dataFieldRepository.save(existingDataField);
      }
    }
  }

  static async recursiveParseJson(
    dataPathPrefix: string,
    dataSection: DataSection,
    jsonBody: any,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (getDataType(jsonBody) === DataType.OBJECT) {
      for (const key in jsonBody) {
        this.recursiveParseJson(
          `${dataPathPrefix}.${key}`,
          dataSection,
          jsonBody[key],
          apiEndpoint
        );
      }
    } else if (getDataType(jsonBody) === DataType.ARRAY) {
      for (const item of jsonBody) {
        this.recursiveParseJson(dataPathPrefix, dataSection, item, apiEndpoint);
      }
    } else {
      const matches = ScannerService.scan(jsonBody);
      const matchesKeys = Object.keys(matches);
      if (matchesKeys?.length > 0) {
        for (const match of matchesKeys) {
          const matchDataClass = match as DataClass;
          await this.saveDataField(
            matchDataClass,
            dataPathPrefix,
            dataSection,
            apiEndpoint,
            matches[match],
            jsonBody
          );
        }
      } else {
        await this.saveDataField(
          null,
          dataPathPrefix,
          dataSection,
          apiEndpoint,
          [],
          jsonBody
        );
      }
    }
  }

  static async findBodyDataFields(
    dataSection: DataSection,
    body: string,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (body) {
      const jsonBody = parsedJson(body);
      if (jsonBody) {
        for (let key in jsonBody) {
          await this.recursiveParseJson(
            key,
            dataSection,
            jsonBody[key],
            apiEndpoint
          );
        }
      } else {
        await this.recursiveParseJson("", dataSection, body, apiEndpoint);
      }
    }
  }

  static async findPairObjectDataFields(
    dataSection: DataSection,
    data: PairObject[],
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (data) {
      for (const item of data) {
        const field = item.name;
        const jsonBody = parsedJson(item.value);
        await this.recursiveParseJson(
          field,
          dataSection,
          jsonBody ?? item.value,
          apiEndpoint
        );
      }
    }
  }

  static async findPathDataFields(
    path: string,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    if (!path || !apiEndpoint?.path) {
      return;
    }
    const tracePathTokens = path.split("/");
    const endpointPathTokens = apiEndpoint.path.split("/");
    if (tracePathTokens.length !== endpointPathTokens.length) {
      return;
    }
    for (let i = 0; i < endpointPathTokens.length; i++) {
      const currToken = endpointPathTokens[i];
      if (currToken.startsWith("{") && currToken.endsWith("}")) {
        await this.recursiveParseJson(
          currToken.slice(1, -1),
          DataSection.REQUEST_PATH,
          tracePathTokens[i],
          apiEndpoint
        );
      }
    }
  }

  static async findAllDataFields(
    apiTrace: ApiTrace,
    apiEndpoint: ApiEndpoint
  ): Promise<void> {
    await this.findPathDataFields(apiTrace.path, apiEndpoint);
    await this.findPairObjectDataFields(
      DataSection.REQUEST_QUERY,
      apiTrace.requestParameters,
      apiEndpoint
    );
    await this.findPairObjectDataFields(
      DataSection.REQUEST_HEADER,
      apiTrace.requestHeaders,
      apiEndpoint
    );
    await this.findPairObjectDataFields(
      DataSection.RESPONSE_HEADER,
      apiTrace.responseHeaders,
      apiEndpoint
    );
    await this.findBodyDataFields(
      DataSection.REQUEST_BODY,
      apiTrace.requestBody,
      apiEndpoint
    );
    await this.findBodyDataFields(
      DataSection.RESPONSE_BODY,
      apiTrace.responseBody,
      apiEndpoint
    );
    apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields);
  }
}
