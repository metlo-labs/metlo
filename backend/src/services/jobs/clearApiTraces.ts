import { DateTime } from "luxon"
import { ApiTrace } from "models"
import { AppDataSource } from "data-source"
import {
  aggregateTracesDataHourlyQuery,
  aggregateTracesDataMinutelyQuery,
} from "./queries"

const clearApiTraces = async (): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const now = DateTime.now().startOf("hour")
    const oneHourAgo = now.minus({ hours: 1 }).toJSDate()

    const maxTimeRes = await queryRunner.manager
      .createQueryBuilder()
      .select([`MAX("createdAt") as "maxTime"`])
      .from(ApiTrace, "traces")
      .where('"apiEndpointUuid" IS NOT NULL')
      .andWhere("analyzed = TRUE")
      .andWhere('"createdAt" < :oneHourAgo', { oneHourAgo })
      .getRawOne()
    const maxTime: Date = maxTimeRes?.maxTime ?? null

    if (maxTime) {
      await queryRunner.startTransaction()
      await queryRunner.query(aggregateTracesDataMinutelyQuery, [maxTime])
      await queryRunner.query(aggregateTracesDataHourlyQuery, [maxTime])
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ApiTrace)
        .where('"apiEndpointUuid" IS NOT NULL')
        .andWhere("analyzed = TRUE")
        .andWhere('"createdAt" <= :maxTime', { maxTime })
        .execute()
      await queryRunner.commitTransaction()
    }
  } catch (err) {
    console.error(`Encountered error while clearing trace data: ${err}`)
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner?.release()
  }
}

export default clearApiTraces
