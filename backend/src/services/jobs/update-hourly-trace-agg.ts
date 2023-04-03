import { AppDataSource } from "data-source"
import mlog from "logger"
import { AggregateTraceDataHourly } from "models"
import { getQB } from "services/database/utils"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { ENDPOINT_CALL_COUNT_HASH } from "~/constants"

export async function updateHourlyTraceAggregate(ctx: MetloContext) {
  const res = await RedisClient.getHash(ctx, ENDPOINT_CALL_COUNT_HASH)
  await RedisClient.deleteKeyFromRedis(ctx, ENDPOINT_CALL_COUNT_HASH)
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const qb = getQB(ctx, queryRunner)
    const currentTime = new Date().getTime()
    const currentHour = new Date(currentTime - (currentTime % (1000 * 60 * 60)))

    const tableMeta = AppDataSource.getMetadata(AggregateTraceDataHourly)
    const apiEndpointUuidDBName =
      tableMeta.findColumnWithPropertyName("apiEndpointUuid").databaseName
    const numCallsDBName =
      tableMeta.findColumnWithPropertyName("numCalls").databaseName
    const hourDBName = tableMeta.findColumnWithPropertyName("hour").databaseName

    await qb
      .createQueryBuilder()
      .insert()
      .into(AggregateTraceDataHourly)
      .values(
        Object.entries(res).map(([endpointUUID, count]) => ({
          apiEndpointUuid: endpointUUID,
          numCalls: parseInt(count),
          hour: currentHour,
        })),
      )
      // onConflict has been deprecated, but only way to write this without completely handwritten query.
      .onConflict(
        `( "${apiEndpointUuidDBName}","${hourDBName}" )
         do update
         set "${numCallsDBName}" = ${AggregateTraceDataHourly.getTableName(
          ctx,
        )}."${numCallsDBName}" + EXCLUDED."${numCallsDBName}"`,
      )
      .execute()
  } catch (err) {
    mlog.withErr(err).err("Error while updating hourly trace aggregate table")
    return false
  } finally {
    await queryRunner.release()
  }
  return true
}
