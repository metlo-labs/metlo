import { DateTime } from "luxon"
import { ApiTrace } from "models"
import { AppDataSource } from "data-source"
import { aggregateTracesDataHourlyQuery } from "./queries"
import { MetloContext } from "types"
import { getQB } from "services/database/utils"

const clearApiTraces = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const now = DateTime.now()
    const oneHourAgo = now.minus({ hours: 1 }).toJSDate()

    const maxTimeRes = await getQB(ctx, queryRunner)
      .select([`MAX("createdAt") as "maxTime"`])
      .from(ApiTrace, "traces")
      .andWhere('"apiEndpointUuid" IS NOT NULL')
      .andWhere('"createdAt" < :oneHourAgo', { oneHourAgo })
      .getRawOne()
    const maxTime: Date = maxTimeRes?.maxTime ?? null

    if (maxTime) {
      await queryRunner.startTransaction()
      await queryRunner.query(aggregateTracesDataHourlyQuery, [maxTime])
      await getQB(ctx, queryRunner)
        .delete()
        .from(ApiTrace)
        .andWhere('"apiEndpointUuid" IS NOT NULL')
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
