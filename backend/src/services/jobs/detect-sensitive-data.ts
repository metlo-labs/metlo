import mlog from "logger"
import { ApiEndpoint, ApiTrace, DataField } from "models"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"
import { getEntityManager, getQB } from "services/database/utils"
import { RedisClient } from "utils/redis"
import { getCombinedDataClasses } from "services/data-classes"
import { getSensitiveDataMap } from "services/scanner/analyze-trace"
import { QueryRunner } from "typeorm"
import { DataClass } from "@common/types"
import { DataTag } from "@common/enums"

const MIN_ANALYZE_TRACES = 50
const MIN_DETECT_THRESH = 0.5

export const getUniqueDataClasses = (
  existingDataField: DataField,
  dataClasses: string[],
) => {
  const classes: Record<"dataClasses" | "scannerIdentified", string[]> = {
    dataClasses: [...existingDataField.dataClasses],
    scannerIdentified: [...existingDataField.scannerIdentified],
  }
  let updated = false
  for (const dataClass of dataClasses) {
    if (
      !classes.dataClasses.includes(dataClass) &&
      !existingDataField.falsePositives.includes(dataClass)
    ) {
      classes.dataClasses.push(dataClass)
      classes.scannerIdentified.push(dataClass)
      updated = true
    }
  }
  return { ...classes, updated }
}

const detectSensitiveDataEndpoint = async (
  ctx: MetloContext,
  uuid: string,
  path: string,
  dataClasses: DataClass[],
  queryRunner: QueryRunner,
): Promise<void> => {
  const endpointTraceKey = `endpointTraces:e#${uuid}`
  const traceCache =
    (await RedisClient.lrange(ctx, endpointTraceKey, 0, -1)) || []
  if (traceCache.length < MIN_ANALYZE_TRACES) {
    return
  }
  const traces = traceCache.map(e => JSON.parse(e) as ApiTrace)
  const sensitiveDataMaps = traces.map(e =>
    getSensitiveDataMap(dataClasses, e, path),
  )
  let detectedDataClasses: Record<
    string,
    { totalCount: number; dataClasses: Record<string, number> }
  > = {}
  sensitiveDataMaps.forEach(dataMap => {
    Object.entries(dataMap).map(([key, detectedData]) => {
      if (!detectedDataClasses[key]) {
        detectedDataClasses[key] = { totalCount: 0, dataClasses: {} }
      }
      detectedDataClasses[key].totalCount += 1
      detectedData.forEach(e => {
        if (!detectedDataClasses[key].dataClasses[e]) {
          detectedDataClasses[key].dataClasses[e] = 0
        }
        detectedDataClasses[key].dataClasses[e] += 1
      })
    })
  })

  const dataFields = await getEntityManager(ctx, queryRunner).find(DataField, {
    where: {
      apiEndpointUuid: uuid,
    },
  })
  for (const e of dataFields) {
    const key = `${e.statusCode}_${e.contentType}_${e.dataSection}${
      e.dataPath ? "." : ""
    }${e.dataPath}`
    const detectedData = detectedDataClasses[key]
    if (!(detectedData && detectedData.totalCount > MIN_ANALYZE_TRACES)) {
      continue
    }
    const totalCount = detectedData.totalCount
    const detectedFields = Object.entries(detectedData.dataClasses)
      .filter(([e, num]) => num / totalCount > MIN_DETECT_THRESH)
      .map(([e, num]) => e)
    const classes = getUniqueDataClasses(e, detectedFields)
    if (classes.updated) {
      e.dataClasses = [...classes.dataClasses]
      e.scannerIdentified = [...classes.scannerIdentified]
      if (e.dataClasses.length > 0 && e.dataTag !== DataTag.PII) {
        e.dataTag = DataTag.PII
      } else if (e.dataClasses.length === 0 && e.dataTag !== null) {
        e.dataTag = null
      }
      await getEntityManager(ctx, queryRunner).save(e)
    }
  }
}

const detectSensitiveData = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const endpoints: { uuid: string; path: string }[] = await getQB(
      ctx,
      queryRunner,
    )
      .select(["uuid", "path"])
      .from(ApiEndpoint, "endpoint")
      .execute()
    const dataClasses = await getCombinedDataClasses(ctx)
    for (const { uuid, path } of endpoints) {
      await detectSensitiveDataEndpoint(ctx, uuid, path, dataClasses, queryRunner)
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
