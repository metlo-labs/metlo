import mlog from "logger"
import { ApiEndpoint, ApiTrace } from "models"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"
import { getQB } from "services/database/utils"
import { RedisClient } from "utils/redis"

const detectSensitiveData = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const endpoints: { uuid: string }[] = await getQB(ctx, queryRunner)
      .delete()
      .from(ApiEndpoint)
      .select(["uuid"])
      .execute()
    const endpointUUIDs = endpoints.map(e => e.uuid)
    for (const uuid of endpointUUIDs) {
      const endpointTraceKey = `endpointTraces:e#${uuid}`
      const traceCache =
        (await RedisClient.lrange(ctx, endpointTraceKey, 0, -1)) || []
      const traces = traceCache.map(e => JSON.parse(e) as ApiTrace)
    }
    await queryRunner.commitTransaction()
  } catch (err) {
    mlog.withErr(err).error("Encountered error while clearing trace data")
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner?.release()
  }
}

export default detectSensitiveData
