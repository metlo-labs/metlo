import { DataTag, RiskScore } from "@common/enums";
import { Alert, ApiEndpoint, DataField } from "models";
import { AppDataSource } from "data-source";
import { Summary as SummaryResponse } from "@common/types";

export class SummaryService {
  static async getSummaryData(): Promise<SummaryResponse> {
    const alertRepository = AppDataSource.getRepository(Alert);
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const dataFieldRepository = AppDataSource.getRepository(DataField);
    const highRiskAlerts = await alertRepository.countBy({
      riskScore: RiskScore.HIGH,
      resolved: false,
    });
    const newAlerts = await alertRepository.countBy({ resolved: false });
    const endpointsTracked = await apiEndpointRepository.count({});
    const piiDataFields = await dataFieldRepository.countBy({
      dataTag: DataTag.PII,
    });
    return {
      highRiskAlerts,
      newAlerts,
      endpointsTracked,
      piiDataFields,
    };
  }
}
