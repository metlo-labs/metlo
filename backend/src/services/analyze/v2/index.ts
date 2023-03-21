import mlog from "logger"
import { v4 as uuidv4 } from "uuid"
import { ApiTrace, ApiEndpoint, Alert } from "models"
import { RedisClient } from "utils/redis"
import {
  TRACE_IN_MEM_EXPIRE_SEC,
  TRACE_IN_MEM_RETENTION_COUNT,
} from "~/constants"
import { QueryRunner } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import { endpointUpdateDates } from "utils"
import { MetloContext } from "types"
import {
  getEntityManager,
  getQB,
  insertValuesBuilder,
} from "services/database/utils"
import { sendWebhookRequests } from "services/webhook"
import { updateIPs } from "analyze/update-ips"
import { findDataFieldsToSave } from "services/data-field/v2/analyze"
import { createDataFieldAlerts } from "services/alert/sensitive-data"
import { createNewEndpointAlert } from "services/alert/new-endpoint"
import { getSensitiveDataMap } from "services/scanner/v2/analyze-trace"
import { getCombinedDataClassesCached } from "services/data-classes"
import { findOpenApiSpecDiff } from "services/spec/v2"
import { shouldUpdateEndpoint, updateDataFields } from "analyze-traces"

export const analyze = async (
  ctx: MetloContext,
  trace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
  queryRunner: QueryRunner,
  newEndpoint?: boolean,
) => {
  if (apiEndpoint.isGraphQl) {
    const splitPath = trace.path.split("/")
    const graphQlPath = splitPath.pop()
    trace.path = `${splitPath.join("/")}/${graphQlPath.split(".")[0]}`
  }

  const traceUUID = uuidv4()
  mlog.debug(`Analyzing Trace: ${traceUUID}`)
  const prevRiskScore = apiEndpoint.riskScore
  const prevLastActive = apiEndpoint.lastActive
  endpointUpdateDates(trace.createdAt, apiEndpoint)
  mlog.debug(`Analyzing Trace - Updated Dates: ${traceUUID}`)

  if (Array.isArray(trace.requestBody)) {
    trace.requestBody = JSON.stringify(trace.requestBody)
  }
  if (Array.isArray(trace.responseBody)) {
    trace.responseBody = JSON.stringify(trace.responseBody)
  }

  const dataClasses = await getCombinedDataClassesCached(ctx)

  const start1 = performance.now()
  const dataFields = findDataFieldsToSave(ctx, trace, apiEndpoint, dataClasses)
  mlog.time("analyzer.find_data_fields", performance.now() - start1)
  mlog.debug(`Analyzing Trace - Found Datafields: ${traceUUID}`)

  const { processedTraceData, ...apiTrace } = trace

  const start2 = performance.now()
  let alerts = await findOpenApiSpecDiff(
    ctx,
    apiTrace,
    apiEndpoint,
    queryRunner,
    processedTraceData.validationErrors ?? {},
  )
  mlog.time("analyzer.find_openapi_spec_diff", performance.now() - start2)
  mlog.debug(`Analyzing Trace - Found OpenAPI Spec Diffs: ${traceUUID}`)

  const start3 = performance.now()
  const dataFieldAlerts = await createDataFieldAlerts(
    ctx,
    dataFields.dataFields,
    apiEndpoint.uuid,
    apiTrace,
    queryRunner,
    false,
  )
  alerts = alerts.concat(dataFieldAlerts)
  mlog.time("analyzer.create_data_field_alerts", performance.now() - start3)
  mlog.debug(`Analyzing Trace - Created Data Field Alerts: ${traceUUID}`)

  if (newEndpoint) {
    const newEndpointAlert = createNewEndpointAlert(
      apiEndpoint,
      apiTrace.createdAt,
    )
    alerts = alerts.concat(newEndpointAlert)
  }

  const startSensitiveDataPopulate = performance.now()
  const sensitiveDataMap = getSensitiveDataMap(
    dataClasses,
    apiTrace,
    apiEndpoint.path,
    processedTraceData,
    dataFields.mapDataFields,
  )
  let filteredApiTrace = {
    ...apiTrace,
    apiEndpointUuid: apiEndpoint.uuid,
  } as ApiTrace

  mlog.time(
    "analyzer.sensitive_data_populate",
    performance.now() - startSensitiveDataPopulate,
  )
  mlog.debug(`Analyzing Trace - Populated Sensitive Data: ${traceUUID}`)

  await queryRunner.startTransaction()
  const startUpdateDataFields = performance.now()
  await updateDataFields(ctx, dataFields.dataFields, queryRunner, false)
  mlog.time(
    "analyzer.update_data_fields_query",
    performance.now() - startUpdateDataFields,
  )
  mlog.debug(`Analyzing Trace - Updated Data Fields: ${traceUUID}`)

  const start4 = performance.now()
  const traceRes = await getEntityManager(ctx, queryRunner).insert(ApiTrace, [
    filteredApiTrace,
  ])
  filteredApiTrace.uuid = traceRes.identifiers[0].uuid
  mlog.time("analyzer.insert_api_trace_query", performance.now() - start4)
  mlog.debug(`Analyzing Trace - Inserted API Trace: ${traceUUID}`)

  const startTraceRedis = performance.now()
  const endpointTraceKey = `endpointTraces:e#${apiEndpoint.uuid}`
  RedisClient.pushValueToRedisList(ctx, endpointTraceKey, [
    JSON.stringify({
      ...filteredApiTrace,
      sensitiveDataMap,
    }),
  ])
  RedisClient.ltrim(ctx, endpointTraceKey, 0, TRACE_IN_MEM_RETENTION_COUNT - 1)
  RedisClient.expire(ctx, endpointTraceKey, TRACE_IN_MEM_EXPIRE_SEC)
  mlog.time(
    "analyzer.insert_api_trace_redis",
    performance.now() - startTraceRedis,
  )
  mlog.debug(`Analyzing Trace - Inserted API Trace to Redis: ${traceUUID}`)

  const start7 = performance.now()
  await insertValuesBuilder(ctx, queryRunner, Alert, alerts)
    .orIgnore()
    .execute()
  mlog.time("analyzer.insert_alerts_query", performance.now() - start7)
  mlog.debug(`Analyzing Trace - Inserted Alerts: ${traceUUID}`)

  const start8 = performance.now()
  if (shouldUpdateEndpoint(prevRiskScore, prevLastActive, apiEndpoint)) {
    await getQB(ctx, queryRunner)
      .update(ApiEndpoint)
      .set({
        firstDetected: apiEndpoint.firstDetected,
        lastActive: apiEndpoint.lastActive,
        riskScore: apiEndpoint.riskScore,
        graphQlMetadata: apiEndpoint.graphQlMetadata,
      })
      .andWhere("uuid = :id", { id: apiEndpoint.uuid })
      .execute()
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
