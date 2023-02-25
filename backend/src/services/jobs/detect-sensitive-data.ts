import mlog from "logger"
import { Alert, ApiEndpoint, ApiTrace, DataField } from "models"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"
import { getEntityManager, insertValuesBuilder } from "services/database/utils"
import { RedisClient } from "utils/redis"
import { getCombinedDataClassesCached } from "services/data-classes"
import { getSensitiveDataMap } from "services/scanner/analyze-trace"
import { QueryRunner } from "typeorm"
import { DataClass } from "@common/types"
import { DataTag } from "@common/enums"
import { getRiskScore } from "utils"
import { createSensitiveDataAlerts } from "services/alert/sensitive-data"

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
  endpoint: ApiEndpoint,
  dataClasses: DataClass[],
  queryRunner: QueryRunner,
): Promise<void> => {
  const endpointTraceKey = `endpointTraces:e#${endpoint.uuid}`
  const traceCache =
    (await RedisClient.lrange(ctx, endpointTraceKey, 0, -1)) || []
  if (traceCache.length < MIN_ANALYZE_TRACES) {
    return
  }
  const traces = traceCache.map(
    e =>
      JSON.parse(e) as ApiTrace & {
        sensitiveDataMap?: Record<string, string[]>
      },
  )
  const sensitiveDataMaps = traces.map(
    e =>
      e.sensitiveDataMap || getSensitiveDataMap(dataClasses, e, endpoint.path),
  )
  let detectedDataClasses: Record<
    string,
    {
      totalCount: number
      dataClassCounts: Record<string, number>
      dataClassToTrace: Record<string, ApiTrace>
    }
  > = {}
  const validDataClassNames = new Set(dataClasses.map(e => e.className))
  sensitiveDataMaps.forEach((dataMap, idx) => {
    const trace = traces[idx]
    Object.entries(dataMap).forEach(([key, detectedData]) => {
      detectedData = detectedData.filter(e => validDataClassNames.has(e))
      if (detectedData.length == 0) {
        return
      }
      if (!detectedDataClasses[key]) {
        detectedDataClasses[key] = {
          totalCount: 0,
          dataClassCounts: {},
          dataClassToTrace: {},
        }
      }
      detectedDataClasses[key].totalCount += 1
      detectedData.forEach(e => {
        if (!detectedDataClasses[key].dataClassCounts[e]) {
          detectedDataClasses[key].dataClassCounts[e] = 0
        }
        detectedDataClasses[key].dataClassCounts[e] += 1
        detectedDataClasses[key].dataClassToTrace[e] = trace
      })
    })
  })

  const currentDataFields = await getEntityManager(ctx, queryRunner).find(
    DataField,
    {
      where: {
        apiEndpointUuid: endpoint.uuid,
      },
    },
  )

  let newDataFields: DataField[] = []
  let alerts: Alert[] = []
  for (const e of currentDataFields) {
    const key = `${e.statusCode}_${e.contentType}_${e.dataSection}${
      e.dataPath ? "." : ""
    }${e.dataPath}`
    const detectedData = detectedDataClasses[key]
    if (!(detectedData && detectedData.totalCount > MIN_ANALYZE_TRACES)) {
      newDataFields.push(e)
      continue
    }
    const totalCount = detectedData.totalCount
    const detectedFields = Object.entries(detectedData.dataClassCounts)
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
    for (const dataClass of e.dataClasses) {
      const newAlerts = await createSensitiveDataAlerts(
        ctx,
        e,
        dataClass,
        endpoint.uuid,
        endpoint.path,
        detectedData.dataClassToTrace[dataClass],
        queryRunner,
      )
      alerts = alerts.concat(newAlerts)
    }
    newDataFields.push(e)
  }
  await insertValuesBuilder(ctx, queryRunner, Alert, alerts)
    .orIgnore()
    .execute()
  const newRiskScore = getRiskScore(newDataFields, dataClasses)
  if (newRiskScore != endpoint.riskScore) {
    endpoint.riskScore = newRiskScore
    await getEntityManager(ctx, queryRunner).save(endpoint)
  }
}

const detectSensitiveData = async (ctx: MetloContext): Promise<boolean> => {
  mlog.debug("In detect sensitive data job.")
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    mlog.debug("Connected sensitive data queryrunner.")
    const endpoints = await getEntityManager(ctx, queryRunner).find(ApiEndpoint)
    mlog.debug(`Detecting sensitive data for ${endpoints.length} endpoints.`)
    const dataClasses = await getCombinedDataClassesCached(ctx)
    for (const e of endpoints) {
      mlog.debug(`Detecting sensitive data for endpoint: ${e.uuid}`)
      try {
        await detectSensitiveDataEndpoint(ctx, e, dataClasses, queryRunner)
      } catch (err) {
        mlog
          .withErr(err)
          .error(
            `Encountered error while detecting sensitive data for endpoint ${e.uuid}`,
          )
      }
    }
    return true
  } catch (err) {
    mlog.withErr(err).error("Encountered error while detecting sensitive data")
    return false
  } finally {
    await queryRunner.release()
  }
}

export default detectSensitiveData
