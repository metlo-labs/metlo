import { AppDataSource } from "data-source"
import { Alert } from "models"
import { DataSection, DataTag, AlertType, Status } from "@common/enums"
import {
  updateUnauthenticatedEndpoints,
  getUnauthenticatedEndpointsSensitiveData,
} from "./queries"
import { AlertService } from "services/alert"

const checkForUnauthenticatedEndpoints = async (): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    await queryRunner.query(updateUnauthenticatedEndpoints)
    const endpointsToAlert = await queryRunner.query(
      getUnauthenticatedEndpointsSensitiveData,
      [
        DataSection.RESPONSE_BODY,
        DataTag.PII,
        AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA,
        Status.RESOLVED,
      ],
    )
    const alerts = await AlertService.createUnauthEndpointSenDataAlerts(
      endpointsToAlert,
    )
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Alert)
      .values(alerts)
      .execute()
  } catch (err) {
    console.error(
      `Encountered error when checking for unauthenticated endpoints: ${err}`,
    )
  } finally {
    await queryRunner.release()
  }
}

export default checkForUnauthenticatedEndpoints
