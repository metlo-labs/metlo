import { FindOptionsWhere, In, FindManyOptions } from "typeorm";
import { AppDataSource } from "data-source";
import { Alert, ApiEndpoint } from "models";
import { AlertType } from "@common/enums";
import { ALERT_TYPE_TO_RISK_SCORE, RISK_SCORE_ORDER_QUERY } from "~/constants";
import { GetAlertParams, Alert as AlertResponse } from "@common/types";

export class AlertService {
  static async getAlerts(
    alertParams: GetAlertParams
  ): Promise<[AlertResponse[], number]> {
    const alertRepository = AppDataSource.getRepository(Alert);

    let alertsQb = alertRepository
      .createQueryBuilder("alert")
      .leftJoinAndSelect("alert.apiEndpoint", "apiEndpoint");

    if (alertParams?.alertTypes) {
      alertsQb = alertsQb.where("alert.type IN (:...types)", {
        types: alertParams.alertTypes,
      });
    }
    if (alertParams?.riskScores) {
      alertsQb = alertsQb.andWhere("alert.riskScore IN (:...scores)", {
        scores: alertParams.riskScores,
      });
    }
    if (alertParams?.resolved) {
      alertsQb = alertsQb.andWhere("alert.resolved = :resolved", {
        resolved: alertParams.resolved,
      });
    }
    alertsQb = alertsQb
      .orderBy(RISK_SCORE_ORDER_QUERY, "DESC")
      .addOrderBy("alert.createdAt", "DESC");
    if (alertParams?.offset) {
      alertsQb = alertsQb.offset(alertParams.offset);
    }
    if (alertParams?.limit) {
      alertsQb = alertsQb.limit(alertParams.limit);
    }

    return await alertsQb.getManyAndCount();
  }

  static async getTopAlerts(): Promise<AlertResponse[]> {
    const alertRepository = AppDataSource.getRepository(Alert);
    return await alertRepository
      .createQueryBuilder("alert")
      .leftJoinAndSelect("alert.apiEndpoint", "apiEndpoint")
      .where("alert.resolved = false")
      .orderBy(RISK_SCORE_ORDER_QUERY, "DESC")
      .addOrderBy("alert.createdAt", "DESC")
      .limit(20)
      .getMany();
  }

  static async getAlert(alertId: string): Promise<AlertResponse> {
    const alertRepository = AppDataSource.getRepository(Alert);
    return await alertRepository.findOneBy({ uuid: alertId });
  }

  static async getAlertWithConditions(
    conditions: FindOptionsWhere<Alert>
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert);
    return await alertRepository.findOneBy(conditions);
  }

  static async createAlert(
    alertType: AlertType,
    apiEndpoint: ApiEndpoint,
    description?: string[],
    noDuplicate?: boolean
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert);
    if (noDuplicate) {
      const existingUnresolvedAlert = alertRepository.findOneBy({
        apiEndpointUuid: apiEndpoint.uuid,
        type: alertType,
        resolved: false,
      });
      if (existingUnresolvedAlert) {
        return null;
      }
    }
    const newAlert = new Alert();
    newAlert.type = alertType;
    newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[alertType];
    newAlert.apiEndpoint = apiEndpoint;
    if (description) {
      newAlert.description = description;
    } else {
      switch (alertType) {
        case AlertType.NEW_ENDPOINT:
          newAlert.description = [
            `A new endpoint has been detected: ${apiEndpoint.path}`,
          ];
          break;
        default:
          newAlert.description = [`A new alert.`];
      }
    }
    return await alertRepository.save(newAlert);
  }

  static async resolveAlert(
    alertId: string,
    resolutionMessage: string
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert);
    const existingAlert = await alertRepository.findOneBy({ uuid: alertId });
    existingAlert.resolved = true;
    existingAlert.resolutionMessage = resolutionMessage || "";
    return await alertRepository.save(existingAlert);
  }
}
