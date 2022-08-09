import { RiskScore } from "../../enums";
import { Alert, ApiEndpoint, MatchedDataClass } from "../../../models";
import { AppDataSource } from "../../data-source";
import { SummaryResponse } from "../../types";

export class SummaryService {
  static async getSummaryData(): Promise<SummaryResponse> {
    const alertRepository = AppDataSource.getRepository(Alert);
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const matchedDataClassRepository =
      AppDataSource.getRepository(MatchedDataClass);
    const highRiskAlerts = await alertRepository.countBy({
      riskScore: RiskScore.HIGH,
      resolved: false,
    });
    const newAlerts = await alertRepository.countBy({ resolved: false });
    const endpointsTracked = await apiEndpointRepository.count({});
    const piiDataFields = await matchedDataClassRepository.countBy({
      isRisk: true,
    });
    return {
      highRiskAlerts,
      newAlerts,
      endpointsTracked,
      piiDataFields,
    };
  }
}
