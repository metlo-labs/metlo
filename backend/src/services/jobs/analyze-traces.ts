import { AppDataSource } from "data-source"
import { ApiTrace, ApiEndpoint, DataField, Alert } from "models"
import { DataFieldService } from "services/data-field"
import { SpecService } from "services/spec"
import { AlertService } from "services/alert"
import { DatabaseService } from "services/database"

const analyzeTraces = async (): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const qb = queryRunner.manager
      .createQueryBuilder()
      .from(ApiTrace, "traces")
      .where(`"apiEndpointUuid" IS NOT NULL`)
      .andWhere("analyzed = FALSE")
      .orderBy('"createdAt"', "ASC")
      .limit(5000)
    let traces = await qb.getRawMany()

    while (traces && traces.length > 0) {
      for (const trace of traces) {
        const apiEndpoint = await queryRunner.manager.findOne(ApiEndpoint, {
          where: {
            uuid: trace.apiEndpointUuid,
          },
          relations: { dataFields: true },
        })
        if (apiEndpoint) {
          apiEndpoint.updateDates(trace.createdAt)
          const dataFields = DataFieldService.findAllDataFields(
            trace,
            apiEndpoint,
          )
          let alerts = await SpecService.findOpenApiSpecDiff(
            trace,
            apiEndpoint,
            queryRunner,
          )
          const sensitiveDataAlerts = await AlertService.createDataFieldAlerts(
            dataFields,
            apiEndpoint.uuid,
            apiEndpoint.path,
            trace,
          )
          alerts = alerts?.concat(sensitiveDataAlerts)

          await queryRunner.startTransaction()
          await DatabaseService.retryTypeormTransaction(
            () =>
              queryRunner.manager
                .createQueryBuilder()
                .update(ApiTrace)
                .set({ analyzed: true })
                .where("uuid = :id", { id: trace.uuid })
                .execute(),
            5,
          )
          await DatabaseService.retryTypeormTransaction(
            () =>
              queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(DataField)
                .values(dataFields)
                .orUpdate(
                  [
                    "dataClasses",
                    "scannerIdentified",
                    "dataType",
                    "dataTag",
                    "matches",
                  ],
                  ["dataSection", "dataPath", "apiEndpointUuid"],
                )
                .execute(),
            5,
          )
          await DatabaseService.retryTypeormTransaction(
            () =>
              queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(Alert)
                .values(alerts)
                .orIgnore()
                .execute(),
            5,
          )
          await DatabaseService.retryTypeormTransaction(
            () =>
              queryRunner.manager
                .createQueryBuilder()
                .update(ApiEndpoint)
                .set({
                  firstDetected: apiEndpoint.firstDetected,
                  lastActive: apiEndpoint.lastActive,
                  riskScore: apiEndpoint.riskScore,
                })
                .where("uuid = :id", { id: apiEndpoint.uuid })
                .execute(),
            5,
          )
          await queryRunner.commitTransaction()
        }
      }
      traces = await qb.getRawMany()
    }
  } catch (err) {
    console.error(`Encountered error while analyzing traces: ${err}`)
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner.release()
  }
}

export default analyzeTraces
