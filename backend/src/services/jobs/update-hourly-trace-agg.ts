import { AppDataSource } from "data-source"
import mlog from "logger"
import { AggregateTraceDataHourly } from "models"
import { getQB, getRepository } from "services/database/utils"
import { In } from "typeorm"
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
    const existingEndpoints = (
      await getRepository(ctx, AggregateTraceDataHourly).find({
        where: { apiEndpointUuid: In(Object.keys(res)) },
        select: { apiEndpointUuid: true },
      })
    ).map(entry => entry.apiEndpointUuid)

    const newEndpoints = Object.keys(res).filter(
      endpointUUID => !existingEndpoints.includes(endpointUUID),
    )

    await Promise.allSettled(
      existingEndpoints.map(endpointUUID => {
        return qb
          .update(AggregateTraceDataHourly)
          .set({
            numCalls: () => `"numCalls" + :newCalls `,
          })
          .setParameter("newCalls", parseInt(res[endpointUUID]))
          .where({ apiEndpointUuid: endpointUUID, hour: currentHour })
          .execute()
      }),
    )
    await qb
      .createQueryBuilder()
      .insert()
      .into(AggregateTraceDataHourly)
      .values(
        newEndpoints.map(endpointUUID => ({
          apiEndpointUuid: endpointUUID,
          numCalls: parseInt(res[endpointUUID]),
          hour: currentHour,
        })),
      )
      .execute()
  } catch (err) {
    mlog.withErr(err).err("Error while updating hourly trace aggregate table")
  } finally {
    await queryRunner.release()
  }
  return true
}
