import mlog from "logger"
import { AppDataSource } from "data-source"
import { Alert } from "models"
import { DataSection, DataTag, AlertType, Status } from "@common/enums"
import {
  updateUnauthenticatedEndpoints,
  getUnauthenticatedEndpointsSensitiveData,
} from "./queries"
import { insertValuesBuilder } from "services/database/utils"
import { MetloContext } from "types"
import { createUnauthEndpointSenDataAlerts } from "services/alert/sensitive-data"

const checkForUnauthenticatedEndpoints = async (
  ctx: MetloContext,
): Promise<boolean> => {
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
    const alerts = await createUnauthEndpointSenDataAlerts(endpointsToAlert)
    await insertValuesBuilder(ctx, queryRunner, Alert, alerts).execute()
    return true
  } catch (err) {
    mlog
      .withErr(err)
      .error("Encountered error when checking for unauthenticated endpoints")
    return false
  } finally {
    await queryRunner.release()
  }
}

export default checkForUnauthenticatedEndpoints
