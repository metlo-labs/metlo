import { v4 as uuidv4 } from "uuid"
import { AppDataSource } from "data-source"
import { ApiTrace, ApiEndpoint, DataField, Alert } from "models"
import { DataFieldService } from "services/data-field"
import { SpecService } from "services/spec"
import { AlertService } from "services/alert"
import { RedisClient } from "utils/redis"
import { TRACES_QUEUE } from "~/constants"
import { QueryRunner } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import {
  endpointAddNumberParams,
  endpointUpdateDates,
  isSuspectedParamater,
  skipAutoGeneratedMatch,
} from "utils"
import { getPathTokens } from "@common/utils"
import { AlertType } from "@common/enums"
import { isGraphQlEndpoint } from "services/graphql"
import { isQueryFailedError, retryTypeormTransaction } from "utils/db"
import { MetloContext } from "types"
import { DatabaseService } from "services/database"

const GET_ENDPOINT_QUERY = `
SELECT
  endpoint. *,
  CASE WHEN spec."isAutoGenerated" IS NULL THEN NULL ELSE json_build_object('isAutoGenerated', spec."isAutoGenerated") END as "openapiSpec"
FROM
  "api_endpoint" endpoint
  LEFT JOIN "open_api_spec" spec ON endpoint."openapiSpecName" = spec.name
WHERE
  $1 ~ "pathRegex"
  AND method = $2
  AND host = $3
GROUP BY
  1,
  spec."isAutoGenerated"
ORDER BY
  endpoint."numberParams" ASC
LIMIT
  1
`

const GET_DATA_FIELDS_QUERY = `
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
  "apiEndpointUuid"
FROM
  data_field
WHERE
  "apiEndpointUuid" = $1
`

const getQueuedApiTrace = async (
  ctx: MetloContext,
): Promise<QueuedApiTrace> => {
  try {
    const traceString = await RedisClient.popValueFromRedisList(
      ctx,
      TRACES_QUEUE,
    )
    return JSON.parse(traceString)
  } catch (err) {
    return null
  }
}

const analyze = async (
  trace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
  queryRunner: QueryRunner,
  newEndpoint?: boolean,
) => {
  endpointUpdateDates(trace.createdAt, apiEndpoint)
  const dataFields = DataFieldService.findAllDataFields(trace, apiEndpoint)
  let alerts = await SpecService.findOpenApiSpecDiff(
    trace,
    apiEndpoint,
    queryRunner,
  )
  const sensitiveDataAlerts = await AlertService.createDataFieldAlerts(
    dataFields,
    apiEndpoint.uuid,
    apiEndpoint.path,
    trace,
    queryRunner,
  )
  alerts = alerts?.concat(sensitiveDataAlerts)
  if (newEndpoint) {
    const newEndpointAlert = await AlertService.createAlert(
      AlertType.NEW_ENDPOINT,
      apiEndpoint,
    )
    newEndpointAlert.createdAt = trace.createdAt
    newEndpointAlert.updatedAt = trace.createdAt
    alerts = alerts?.concat(newEndpointAlert)
  }

  await queryRunner.startTransaction()
  await retryTypeormTransaction(
    () =>
      queryRunner.manager.insert(ApiTrace, {
        ...trace,
        apiEndpointUuid: apiEndpoint.uuid,
      }),
    5,
  )
  await retryTypeormTransaction(
    () =>
      queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(DataField)
        .values(dataFields)
        .orUpdate(
          [
            "dataClasses",
            "scannerIdentified",
            "dataType",
            "dataTag",
            "matches",
          ],
          ["dataSection", "dataPath", "apiEndpointUuid"],
        )
        .execute(),
    5,
  )
  await retryTypeormTransaction(
    () =>
      queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Alert)
        .values(alerts)
        .orIgnore()
        .execute(),
    5,
  )
  await retryTypeormTransaction(
    () =>
      queryRunner.manager
        .createQueryBuilder()
        .update(ApiEndpoint)
        .set({
          firstDetected: apiEndpoint.firstDetected,
          lastActive: apiEndpoint.lastActive,
          riskScore: apiEndpoint.riskScore,
        })
        .where("uuid = :id", { id: apiEndpoint.uuid })
        .execute(),
    5,
  )
  await queryRunner.commitTransaction()
}

const generateEndpoint = async (
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
          queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(ApiEndpoint)
            .values(apiEndpoint)
            .execute(),
        5,
      )
      await queryRunner.commitTransaction()
      await analyze(trace, apiEndpoint, queryRunner, true)
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      if (isQueryFailedError(err) && err.code === "23505") {
        const existingEndpoint = await queryRunner.manager.findOne(
          ApiEndpoint,
          {
            where: {
              path: trace.path,
              host: trace.host,
              method: trace.method,
            },
            relations: { dataFields: true },
          },
        )
        if (existingEndpoint) {
          await analyze(trace, existingEndpoint, queryRunner)
        }
      } else {
        console.error(`Error generating new endpoint: ${err}`)
      }
    }
  }
}

const analyzeTraces = async (): Promise<void> => {
  const ctx: MetloContext = {}

  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")
  console.log("Running Analyzer...")
  let queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  while (true) {
    try {
      const trace = await getQueuedApiTrace(ctx)
      if (trace) {
        trace.createdAt = new Date(trace.createdAt)
        const apiEndpoint: ApiEndpoint = (
          await queryRunner.query(GET_ENDPOINT_QUERY, [
            trace.path,
            trace.method,
            trace.host,
          ])
        )?.[0]
        if (apiEndpoint && !skipAutoGeneratedMatch(apiEndpoint, trace.path)) {
          const dataFields: DataField[] = await DatabaseService.executeRawQuery(
            GET_DATA_FIELDS_QUERY,
            [apiEndpoint.uuid],
          )
          apiEndpoint.dataFields = dataFields
          await analyze(trace, apiEndpoint, queryRunner)
        } else {
          if (trace.responseStatus !== 404 && trace.responseStatus !== 405) {
            await generateEndpoint(trace, queryRunner)
          }
        }
      }
    } catch (err) {
      console.error(`Encountered error while analyzing traces: ${err}`)
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
