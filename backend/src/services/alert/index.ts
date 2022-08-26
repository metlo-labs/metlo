import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "data-source";
import { Alert, ApiEndpoint, ApiTrace } from "models";
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
      .orderBy(RISK_SCORE_ORDER_QUERY("alert", "riskScore"), "DESC")
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
      .orderBy(RISK_SCORE_ORDER_QUERY("alert", "riskScore"), "DESC")
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

  static async existingUnresolvedAlert(
    apiEndpointUuid: string,
    type: AlertType,
    description: string
  ) {
    const alertRepository = AppDataSource.getRepository(Alert);
    return await alertRepository.findOneBy({
      apiEndpointUuid,
      type,
      resolved: false,
      description,
    });
  }

  static async createAlert(
    alertType: AlertType,
    apiEndpoint: ApiEndpoint,
    description?: string,
    context?: object,
    noDuplicate?: boolean
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert);
    let alertDescription = description;
    if (!alertDescription) {
      switch (alertType) {
        case AlertType.NEW_ENDPOINT:
          alertDescription = `A new endpoint has been detected: ${apiEndpoint.path}`;
          break;
        case AlertType.OPEN_API_SPEC_DIFF:
          alertDescription = `A OpenAPI Spec diff has been detected.`;
          break;
        case AlertType.PII_DATA_DETECTED:
          alertDescription = `PII Data has been detected.`;
          break;
        default:
          alertDescription = `A new alert.`;
      }
    }
    if (noDuplicate) {
      const existing = await this.existingUnresolvedAlert(
        apiEndpoint.uuid,
        alertType,
        alertDescription
      );
      if (existing) {
        return null;
      }
    }
    const newAlert = new Alert();
    newAlert.type = alertType;
    newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[alertType];
    newAlert.apiEndpointUuid = apiEndpoint.uuid;
    newAlert.context = context;
    newAlert.description = alertDescription;
    return newAlert;
  }

  static async createSpecDiffAlerts(
    alertItems: Record<string, string[]>,
    apiEndpointUuid: string,
    apiTrace: ApiTrace
  ): Promise<Alert[]> {
    if (!alertItems) {
      return [];
    }
    if (Object.keys(alertItems)?.length === 0) {
      return [];
    }
    let alerts: Alert[] = [];
    for (const key in alertItems) {
      const existing = await this.existingUnresolvedAlert(
        apiEndpointUuid,
        AlertType.OPEN_API_SPEC_DIFF,
        key
      );
      if (!existing) {
        const newAlert = new Alert();
        newAlert.type = AlertType.OPEN_API_SPEC_DIFF;
        newAlert.riskScore =
          ALERT_TYPE_TO_RISK_SCORE[AlertType.OPEN_API_SPEC_DIFF];
        newAlert.apiEndpointUuid = apiEndpointUuid;
        newAlert.context = {
          pathPointer: alertItems[key],
          trace: apiTrace,
        };
        newAlert.description = key;
        alerts.push(newAlert);
      }
    }
    return alerts;
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
