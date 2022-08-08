import { FindOptionsWhere, In, FindManyOptions } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Alert, ApiEndpoint } from "../../../models";
import { AlertType } from "../../enums";
import { ALERT_TYPE_TO_RISK_SCORE } from "../../constants";
import { GetAlertParams, AlertResponse } from "../../types";

export class AlertService {
  static async getAlerts(
    alertParams: GetAlertParams
  ): Promise<[AlertResponse[], number]> {
    const alertRepository = AppDataSource.getRepository(Alert);
    let whereConditions: FindOptionsWhere<Alert> = {};
    let paginationParams: FindManyOptions<Alert> = {};

    if (alertParams?.alertTypes) {
      whereConditions = {
        ...whereConditions,
        type: In(alertParams.alertTypes),
      };
    }
    if (alertParams?.riskScores) {
      whereConditions = {
        ...whereConditions,
        riskScore: In(alertParams.riskScores),
      };
    }
    if (alertParams?.resolved) {
      whereConditions = {
        ...whereConditions,
        resolved: alertParams.resolved,
      };
    }
    if (alertParams?.offset) {
      paginationParams = {
        ...paginationParams,
        skip: alertParams.offset,
      };
    }
    if (alertParams?.limit) {
      paginationParams = {
        ...paginationParams,
        take: alertParams.limit,
      };
    }

    const alerts = await alertRepository.findAndCount({
      where: whereConditions,
      ...paginationParams,
      relations: {
        apiEndpoint: true,
      },
    });

    return alerts;
  }

  static async getAlert(alertId: string): Promise<AlertResponse> {
    const alertRepository = AppDataSource.getRepository(Alert);
    return await alertRepository.findOneBy({ uuid: alertId });
  }

  static async createAlert(alertType: AlertType, apiEndpoint: ApiEndpoint) {
    const alertRepository = AppDataSource.getRepository(Alert);
    const newAlert = new Alert();
    newAlert.type = alertType;
    newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[alertType];
    newAlert.apiEndpoint = apiEndpoint;
    switch (alertType) {
      case AlertType.NEW_ENDPOINT:
        newAlert.description = `A new endpoint has been detected: ${apiEndpoint.path}`;
      default:
        newAlert.description = `A new alert.`;
    }
    await alertRepository.save(newAlert);
  }

  static async resolveAlert(alertId: string, resolutionMessage: string) {
    const alertRepository = AppDataSource.getRepository(Alert);
    const existingAlert = await alertRepository.findOneBy({ uuid: alertId });
    existingAlert.resolved = true;
    existingAlert.resolutionMessage = resolutionMessage || "";
    await alertRepository.save(existingAlert);
  }
}
