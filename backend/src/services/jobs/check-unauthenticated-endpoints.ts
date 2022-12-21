import { AppDataSource } from "data-source"
import { Alert } from "models"
import { DataSection, DataTag, AlertType, Status } from "@common/enums"
import {
  updateUnauthenticatedEndpoints,
  getUnauthenticatedEndpointsSensitiveData,
} from "./queries"
import { AlertService } from "services/alert"
import { insertValuesBuilder } from "services/database/utils"
import { MetloContext } from "types"

const checkForUnauthenticatedEndpoints = async (
  ctx: MetloContext,
): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    await queryRunner.query(updateUnauthenticatedEndpoints(ctx))
    const endpointsToAlert = await queryRunner.query(
      getUnauthenticatedEndpointsSensitiveData(ctx),
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
    await insertValuesBuilder(ctx, queryRunner, Alert, alerts).execute()
  } catch (err) {
    console.error(
      `Encountered error when checking for unauthenticated endpoints: ${err}`,
    )
  } finally {
    await queryRunner.release()
  }
}

export default checkForUnauthenticatedEndpoints
