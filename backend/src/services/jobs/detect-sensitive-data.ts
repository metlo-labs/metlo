import mlog from "logger"
import { ApiEndpoint, ApiTrace } from "models"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"
import { getQB } from "services/database/utils"
import { RedisClient } from "utils/redis"
import { getCombinedDataClasses } from "services/data-classes"
import { getSensitiveDataMap } from "services/scanner/analyze-trace"

const MIN_ANALYZE_TRACES = 50

const detectSensitiveData = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const endpoints: { uuid: string; path: string }[] = await getQB(
      ctx,
      queryRunner,
    )
      .delete()
      .from(ApiEndpoint)
      .select(["uuid", "path"])
      .execute()
    const dataClasses = await getCombinedDataClasses(ctx)
    for (const { uuid, path } of endpoints) {
      const endpointTraceKey = `endpointTraces:e#${uuid}`
      const traceCache =
        (await RedisClient.lrange(ctx, endpointTraceKey, 0, -1)) || []
      if (traceCache.length < MIN_ANALYZE_TRACES) {
        continue
      }
      const traces = traceCache.map(e => JSON.parse(e) as ApiTrace)
      const sensitiveDataMaps = traces.map(e =>
        getSensitiveDataMap(dataClasses, e, path),
      )
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
