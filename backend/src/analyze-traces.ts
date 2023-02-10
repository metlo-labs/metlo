import mlog from "logger"
import { v4 as uuidv4 } from "uuid"
import { AppDataSource } from "data-source"
import { ApiTrace, ApiEndpoint, DataField, Alert } from "models"
import { SpecService } from "services/spec"
import { RedisClient } from "utils/redis"
import {
  TRACES_QUEUE,
  TRACE_IN_MEM_EXPIRE_SEC,
  TRACE_IN_MEM_RETENTION_COUNT,
} from "~/constants"
import { QueryRunner, Raw } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import {
  endpointAddNumberParams,
  endpointUpdateDates,
  isSuspectedParamater,
  skipAutoGeneratedMatch,
} from "utils"
import { getPathTokens } from "@common/utils"
import { RiskScore } from "@common/enums"
import { isGraphQlEndpoint } from "services/graphql"
import { isQueryFailedError, retryTypeormTransaction } from "utils/db"
import { MetloContext } from "types"
import {
  getEntityManager,
  getQB,
  insertValueBuilder,
  insertValuesBuilder,
} from "services/database/utils"
import { sendWebhookRequests } from "services/webhook"
import { updateIPs } from "analyze/update-ips"
import { findDataFieldsToSave } from "services/data-field/analyze"
import { createDataFieldAlerts } from "services/alert/sensitive-data"
import { createNewEndpointAlert } from "services/alert/new-endpoint"

export const getDataFieldsQuery = (ctx: MetloContext) => `
SELECT
  uuid,
  "dataClasses"::text[],
  "falsePositives"::text[],
  "scannerIdentified"::text[],
  "dataType",
  "dataTag",
  "dataSection",
  "createdAt",
  "updatedAt",
  "dataPath",
  "apiEndpointUuid",
  "statusCode",
  "contentType",
  "arrayFields",
  "isNullable"
FROM
  ${DataField.getTableName(ctx)} data_field
WHERE
  "apiEndpointUuid" = $1
`

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

const getQueuedApiTrace = async (): Promise<{
  trace: QueuedApiTrace
  ctx: MetloContext
}> => {
  try {
    const unsafeRedisClient = RedisClient.getInstance()
    const traceString = await unsafeRedisClient.lpop(TRACES_QUEUE)
    return JSON.parse(traceString)
  } catch (err) {
    mlog.withErr(err).error("Error getting queued trace")
    return null
  }
}

const shouldUpdateEndpoint = (
  prevRiskScore: RiskScore,
  prevLastActive: Date,
  apiEndpoint: ApiEndpoint,
) => {
  if (
    !prevRiskScore ||
    !prevLastActive ||
    !apiEndpoint?.lastActive ||
    !apiEndpoint?.riskScore
  ) {
    return true
  }
  return (
    prevRiskScore !== apiEndpoint.riskScore ||
    apiEndpoint.lastActive.getTime() - prevLastActive.getTime() > 30_000
  )
}

const analyze = async (
  ctx: MetloContext,
  trace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
  queryRunner: QueryRunner,
  newEndpoint?: boolean,
) => {
  const traceUUID = uuidv4()
  mlog.debug(`Analyzing Trace: ${traceUUID}`)
  const prevRiskScore = apiEndpoint.riskScore
  const prevLastActive = apiEndpoint.lastActive
  endpointUpdateDates(trace.createdAt, apiEndpoint)
  mlog.debug(`Analyzing Trace - Updated Dates: ${traceUUID}`)

  const start1 = performance.now()
  const dataFields = await findDataFieldsToSave(ctx, trace, apiEndpoint)
  mlog.time("analyzer.find_data_fields", performance.now() - start1)
  mlog.debug(`Analyzing Trace - Found Datafields: ${traceUUID}`)

  const start2 = performance.now()
  let alerts = await SpecService.findOpenApiSpecDiff(
    ctx,
    trace,
    apiEndpoint,
    queryRunner,
  )
  mlog.time("analyzer.find_openapi_spec_diff", performance.now() - start2)
  mlog.debug(`Analyzing Trace - Found OpenAPI Spec Diffs: ${traceUUID}`)

  const start3 = performance.now()
  const dataFieldAlerts = await createDataFieldAlerts(
    ctx,
    dataFields.newFields.concat(dataFields.updatedFields),
    apiEndpoint.uuid,
    trace,
    queryRunner,
  )
  alerts = alerts.concat(dataFieldAlerts)
  mlog.time("analyzer.create_data_field_alerts", performance.now() - start3)
  mlog.debug(`Analyzing Trace - Created Data Field Alerts: ${traceUUID}`)

  if (newEndpoint) {
    const newEndpointAlert = createNewEndpointAlert(
      apiEndpoint,
      trace.createdAt,
    )
    alerts = alerts.concat(newEndpointAlert)
  }

  if (Array.isArray(trace.requestBody)) {
    trace.requestBody = JSON.stringify(trace.requestBody)
  }
  if (Array.isArray(trace.responseBody)) {
    trace.responseBody = JSON.stringify(trace.responseBody)
  }

  const start4 = performance.now()
  await queryRunner.startTransaction()
  const traceRes = await retryTypeormTransaction(
    () =>
      getEntityManager(ctx, queryRunner).insert(ApiTrace, [
        {
          ...trace,
          apiEndpointUuid: apiEndpoint.uuid,
        },
      ]),
    5,
  )
  mlog.time("analyzer.insert_api_trace_query", performance.now() - start4)
  mlog.debug(`Analyzing Trace - Inserted API Trace: ${traceUUID}`)

  const startTraceRedis = performance.now()
  const endpointTraceKey = `endpointTraces:e#${apiEndpoint.uuid}`
  RedisClient.pushValueToRedisList(ctx, endpointTraceKey, [
    JSON.stringify({
      ...trace,
      uuid: traceRes.identifiers[0].uuid,
      apiEndpointUuid: apiEndpoint.uuid,
    }),
  ])
  RedisClient.ltrim(ctx, endpointTraceKey, 0, TRACE_IN_MEM_RETENTION_COUNT - 1)
  RedisClient.expire(ctx, endpointTraceKey, TRACE_IN_MEM_EXPIRE_SEC)
  mlog.time(
    "analyzer.insert_api_trace_redis",
    performance.now() - startTraceRedis,
  )
  mlog.debug(`Analyzing Trace - Inserted API Trace to Redis: ${traceUUID}`)

  const start5 = performance.now()
  await retryTypeormTransaction(
    () =>
      insertValuesBuilder(ctx, queryRunner, DataField, dataFields.newFields)
        .orIgnore()
        .execute(),
    5,
  )
  mlog.time("analyzer.insert_data_fields_query", performance.now() - start5)
  mlog.debug(`Analyzing Trace - Inserted Data Fields: ${traceUUID}`)

  const start6 = performance.now()
  if (dataFields.updatedFields.length > 0) {
    await retryTypeormTransaction(
      () =>
        getEntityManager(ctx, queryRunner).saveList<DataField>(
          dataFields.updatedFields,
        ),
      5,
    )
  }
  mlog.time("analyzer.update_data_fields_query", performance.now() - start6)
  mlog.debug(`Analyzing Trace - Updated Data Fields: ${traceUUID}`)

  const start7 = performance.now()
  await retryTypeormTransaction(
    () =>
      insertValuesBuilder(ctx, queryRunner, Alert, alerts).orIgnore().execute(),
    5,
  )
  mlog.time("analyzer.insert_alerts_query", performance.now() - start7)
  mlog.debug(`Analyzing Trace - Inserted Alerts: ${traceUUID}`)

  const start8 = performance.now()
  if (shouldUpdateEndpoint(prevRiskScore, prevLastActive, apiEndpoint)) {
    await retryTypeormTransaction(
      () =>
        getQB(ctx, queryRunner)
          .update(ApiEndpoint)
          .set({
            firstDetected: apiEndpoint.firstDetected,
            lastActive: apiEndpoint.lastActive,
            riskScore: apiEndpoint.riskScore,
          })
          .andWhere("uuid = :id", { id: apiEndpoint.uuid })
          .execute(),
      5,
    )
  }
  mlog.time("analyzer.update_api_endpoint_query", performance.now() - start8)
  mlog.debug(`Analyzing Trace - Updated API Endpoint: ${traceUUID}`)

  const start9 = performance.now()
  await updateIPs(ctx, trace, apiEndpoint, queryRunner)
  mlog.time("analyzer.update_ips", performance.now() - start9)
  mlog.debug(`Analyzing Trace - Updated IPs: ${traceUUID}`)
  await queryRunner.commitTransaction()

  const start10 = performance.now()
  await sendWebhookRequests(ctx, alerts, apiEndpoint)
  mlog.time("analyzer.sent_webhook_requests", performance.now() - start10)
  mlog.debug(`Analyzing Trace - Sent Webhook Requests: ${traceUUID}`)
}

const generateEndpoint = async (
  ctx: MetloContext,
  trace: QueuedApiTrace,
  queryRunner: QueryRunner,
): Promise<void> => {
  const isGraphQl = isGraphQlEndpoint(trace.path)
  let paramNum = 1
  let parameterizedPath = ""
  let pathRegex = String.raw``
  if (isGraphQl) {
    parameterizedPath = trace.path
    pathRegex = trace.path
  } else {
    const pathTokens = getPathTokens(trace.path)
    for (let j = 0; j < pathTokens.length; j++) {
      const tokenString = pathTokens[j]
      if (tokenString === "/") {
        parameterizedPath += "/"
        pathRegex += "/"
      } else if (tokenString.length > 0) {
        if (isSuspectedParamater(tokenString)) {
          parameterizedPath += `/{param${paramNum}}`
          pathRegex += String.raw`/[^/]+`
          paramNum += 1
        } else {
          parameterizedPath += `/${tokenString}`
          pathRegex += String.raw`/${tokenString}`
        }
      }
    }
  }
  if (pathRegex.length > 0) {
    pathRegex = String.raw`^${pathRegex}(/)*$`
    const apiEndpoint = new ApiEndpoint()
    apiEndpoint.uuid = uuidv4()
    apiEndpoint.path = parameterizedPath
    apiEndpoint.pathRegex = pathRegex
    apiEndpoint.host = trace.host
    apiEndpoint.method = trace.method
    endpointAddNumberParams(apiEndpoint)
    apiEndpoint.dataFields = []
    if (isGraphQl) {
      apiEndpoint.isGraphQl = true
    }

    try {
      await queryRunner.startTransaction()
      await retryTypeormTransaction(
        () =>
          insertValueBuilder(
            ctx,
            queryRunner,
            ApiEndpoint,
            apiEndpoint,
          ).execute(),
        5,
      )
      await queryRunner.commitTransaction()
      await analyze(ctx, trace, apiEndpoint, queryRunner, true)
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      if (isQueryFailedError(err) && err.code === "23505") {
        const existingEndpoint = await getEntityManager(
          ctx,
          queryRunner,
        ).findOne(ApiEndpoint, {
          where: {
            path: trace.path,
            host: trace.host,
            method: trace.method,
          },
          relations: { dataFields: true },
        })
        if (existingEndpoint) {
          await analyze(ctx, trace, existingEndpoint, queryRunner)
        }
      } else {
        mlog.withErr(err).error("Error generating new endpoint")
      }
    }
  }
}

const analyzeTraces = async (): Promise<void> => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    mlog.error("Couldn't initialize datasource...")
    return
  }
  mlog.info("AppDataSource Initialized...")
  mlog.info("Running Analyzer...")
  let queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  while (true) {
    try {
      const queued = await getQueuedApiTrace()
      if (queued) {
        const { trace, ctx } = queued
        trace.createdAt = new Date(trace.createdAt)

        const start = performance.now()
        const apiEndpoint: ApiEndpoint = await getEntityManager(
          ctx,
          queryRunner,
        ).findOne(ApiEndpoint, {
          where: {
            pathRegex: Raw(alias => `:path ~ ${alias}`, { path: trace.path }),
            method: trace.method,
            host: trace.host,
          },
          order: {
            numberParams: "ASC",
          },
        })
        mlog.time("analyzer.query_endpoint", performance.now() - start)

        if (apiEndpoint && !skipAutoGeneratedMatch(apiEndpoint, trace.path)) {
          const start2 = performance.now()
          const dataFields = await getEntityManager(ctx, queryRunner).find(
            DataField,
            { where: { apiEndpointUuid: apiEndpoint.uuid } },
          )
          apiEndpoint.dataFields = dataFields
          mlog.time("analyzer.query_data_fields", performance.now() - start2)
          await analyze(ctx, trace, apiEndpoint, queryRunner)
        } else {
          if (trace.responseStatus !== 404 && trace.responseStatus !== 405) {
            await generateEndpoint(ctx, trace, queryRunner)
          }
        }

        mlog.time("analyzer.total_analysis", performance.now() - start)
      } else {
        await sleep(50)
      }
    } catch (err) {
      mlog.withErr(err).error("Encountered error while analyzing traces")
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
    } finally {
      if (queryRunner.isReleased) {
        queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
      }
    }
  }
}

export default analyzeTraces
