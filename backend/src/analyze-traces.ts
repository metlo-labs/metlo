import mlog from "logger"
import { v4 as uuidv4 } from "uuid"
import { AppDataSource } from "data-source"
import { ApiEndpoint, DataField, Hosts } from "models"
import { RedisClient } from "utils/redis"
import { GRAPHQL_SECTIONS, TRACES_QUEUE } from "~/constants"
import { Brackets, QueryBuilder, QueryRunner, Raw } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import {
  endpointAddNumberParams,
  getEndpointToken,
  isSuspectedParamater,
  skipAutoGeneratedMatch,
} from "utils"
import { getPathTokens } from "@common/utils"
import { DataSection, RiskScore } from "@common/enums"
import { isGraphQlEndpoint } from "services/graphql"
import { isQueryFailedError, retryTypeormTransaction } from "utils/db"
import { MetloContext } from "types"
import {
  getEntityManager,
  getQB,
  insertValueBuilder,
  insertValuesBuilder,
} from "services/database/utils"
import { analyze as analyzeV2 } from "services/analyze/v2"
import { analyze } from "services/analyze/v1"
import { getHostMapCached, getCustomWordsCached } from "services/metlo-config"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

const getQueuedApiTrace = async (): Promise<{
  trace: QueuedApiTrace
  ctx: MetloContext
  version: number
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

export const shouldUpdateEndpoint = (
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

export const updateDataFields = async (
  ctx: MetloContext,
  dataFields: DataField[],
  queryRunner: QueryRunner,
  fromSpec: boolean,
) => {
  if (dataFields.length === 0) {
    return
  }
  try {
    await insertValuesBuilder(ctx, queryRunner, DataField, dataFields)
      .orUpdate(
        [
          "dataClasses",
          "scannerIdentified",
          "falsePositives",
          "dataType",
          "dataTag",
          "updatedAt",
          "lastSeen",
          "isNullable",
          "matches",
        ],
        [
          "dataSection",
          "dataPath",
          "apiEndpointUuid",
          "statusCode",
          "contentType",
        ],
      )
      .execute()
  } catch (err) {
    if (isQueryFailedError(err) && err.code === "23505" && !fromSpec) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      await queryRunner.startTransaction()
      await insertValuesBuilder(ctx, queryRunner, DataField, dataFields)
        .orUpdate(
          [
            "dataClasses",
            "scannerIdentified",
            "falsePositives",
            "dataType",
            "dataTag",
            "updatedAt",
            "lastSeen",
            "isNullable",
            "matches",
            "statusCode",
            "contentType",
          ],
          ["uuid"],
        )
        .execute()
    } else {
      throw err
    }
  }
}

const filteredProcessedData = (
  processedDataEntry: Record<string, any>,
  filter: string,
) => {
  const entry = {}
  Object.keys(processedDataEntry ?? {}).forEach(e => {
    const isGraphqlSection = GRAPHQL_SECTIONS.includes(
      e.split(".")[0] as DataSection,
    )
    if ((isGraphqlSection && e.includes(`${filter}.`)) || !isGraphqlSection) {
      entry[e] = processedDataEntry[e]
    }
  })
  return entry
}

const createGraphQlTraces = (trace: QueuedApiTrace): QueuedApiTrace[] => {
  const traces: Record<string, QueuedApiTrace> = {}
  const processedTraceData = trace?.processedTraceData
  for (const operationPath in processedTraceData.dataTypes) {
    if (
      operationPath.includes("query.") ||
      operationPath.includes("mutation.") ||
      operationPath.includes("subscription.")
    ) {
      const splitPath = operationPath.split(".")
      const filter = splitPath[1] + "." + splitPath[2]
      if (!traces[filter]) {
        traces[filter] = {
          ...trace,
          path: `${trace.path}.${filter}`,
          processedTraceData: {
            ...processedTraceData,
            xssDetected: filteredProcessedData(
              processedTraceData?.xssDetected,
              filter,
            ),
            sqliDetected: filteredProcessedData(
              processedTraceData?.sqliDetected,
              filter,
            ),
            sensitiveDataDetected: filteredProcessedData(
              processedTraceData?.sensitiveDataDetected,
              filter,
            ),
            dataTypes: filteredProcessedData(
              processedTraceData?.dataTypes,
              filter,
            ),
          },
        }
      }
    }
  }
  return Object.values(traces)
}

const generateEndpoint = async (
  ctx: MetloContext,
  trace: QueuedApiTrace,
  queryRunner: QueryRunner,
  isGraphQl: boolean,
  analyzeFunc: (
    ctx: MetloContext,
    trace: QueuedApiTrace,
    apiEndpoint: ApiEndpoint,
    queryRunner: QueryRunner,
    newEndpoint?: boolean,
  ) => Promise<void>,
): Promise<void> => {
  await insertValueBuilder(ctx, queryRunner, Hosts, {
    host: trace.host,
    isPublic: false,
  })
    .orIgnore()
    .execute()
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
        const customWords = await getCustomWordsCached(ctx)
        if (isSuspectedParamater(customWords, tokenString)) {
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
    const endpointToken = getEndpointToken(parameterizedPath)
    const apiEndpoint = new ApiEndpoint()
    apiEndpoint.uuid = uuidv4()
    apiEndpoint.path = parameterizedPath
    apiEndpoint.pathRegex = pathRegex
    apiEndpoint.host = trace.host
    apiEndpoint.method = trace.method
    apiEndpoint.token_0 = endpointToken.token_0
    apiEndpoint.token_1 = endpointToken.token_1
    apiEndpoint.token_2 = endpointToken.token_2
    apiEndpoint.token_3 = endpointToken.token_3
    endpointAddNumberParams(apiEndpoint)
    apiEndpoint.dataFields = []
    if (isGraphQl) {
      apiEndpoint.isGraphQl = true
      apiEndpoint.userSet = true
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
      await analyzeFunc(ctx, trace, apiEndpoint, queryRunner, true)
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
          await analyzeFunc(ctx, trace, existingEndpoint, queryRunner)
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
        const { trace, ctx, version } = queued
        trace.createdAt = new Date(trace.createdAt)
        const analyzeFunc = version === 2 ? analyzeV2 : analyze
        const hostMap = await getHostMapCached(ctx)
        for (const e of hostMap) {
          const match = trace.host.match(e.pattern)
          if (match && match[0].length == trace.host.length) {
            trace.originalHost = trace.host
            trace.host = e.host
            break
          }
        }
        const customWords = await getCustomWordsCached(ctx)

        let traces: QueuedApiTrace[] = [trace]
        const isGraphQl = isGraphQlEndpoint(trace.path)
        if (isGraphQl && version === 2) {
          const startCreateGraphQlTraces = performance.now()
          traces = createGraphQlTraces(trace)
          mlog.time(
            "analyzer.create_graphql_traces",
            performance.now() - startCreateGraphQlTraces,
          )
        }

        for (const traceItem of traces) {
          const pathTokens = traceItem.path?.split("/")
          if (pathTokens.length > 0 && pathTokens[0] === "") {
            pathTokens.shift()
          }
          const start = performance.now()
          let endpointQb = getQB(ctx, queryRunner)
            .from(ApiEndpoint, "endpoint")
            .andWhere(`:path ~ "pathRegex"`, { path: traceItem.path })
            .andWhere("method = :method", { method: traceItem.method })
            .andWhere("host = :host", { host: traceItem.host })
          endpointQb = pathTokens[0]
            ? endpointQb.andWhere(
                new Brackets(qb => {
                  qb.where("token_0 = '{param}'").orWhere(
                    "token_0 = :token_0",
                    {
                      token_0: pathTokens[0],
                    },
                  )
                }),
              )
            : endpointQb.andWhere("token_0 IS NULL")
          endpointQb = pathTokens[1]
            ? endpointQb.andWhere(
                new Brackets(qb => {
                  qb.where("token_1 = '{param}'").orWhere(
                    "token_1 = :token_1",
                    {
                      token_1: pathTokens[1],
                    },
                  )
                }),
              )
            : endpointQb.andWhere("token_1 IS NULL")
          endpointQb = pathTokens[2]
            ? endpointQb.andWhere(
                new Brackets(qb => {
                  qb.where("token_2 = '{param}'").orWhere(
                    "token_2 = :token_2",
                    {
                      token_2: pathTokens[2],
                    },
                  )
                }),
              )
            : endpointQb.andWhere("token_2 IS NULL")
          endpointQb = pathTokens[3]
            ? endpointQb.andWhere(
                new Brackets(qb => {
                  qb.where("token_3 = '{param}'").orWhere(
                    "token_3 = :token_3",
                    {
                      token_3: pathTokens[3],
                    },
                  )
                }),
              )
            : endpointQb.andWhere("token_3 IS NULL")
          const apiEndpoint: ApiEndpoint = await endpointQb
            .addOrderBy(`"numberParams"`, "ASC")
            .getRawOne()
          mlog.time("analyzer.query_endpoint", performance.now() - start)

          if (
            apiEndpoint &&
            !skipAutoGeneratedMatch(customWords, apiEndpoint, traceItem.path)
          ) {
            const start2 = performance.now()
            const dataFields = await getEntityManager(ctx, queryRunner).find(
              DataField,
              { where: { apiEndpointUuid: apiEndpoint.uuid } },
            )
            apiEndpoint.dataFields = dataFields
            mlog.time("analyzer.query_data_fields", performance.now() - start2)
            await analyzeFunc(ctx, traceItem, apiEndpoint, queryRunner)
          } else {
            if (
              traceItem.responseStatus !== 404 &&
              traceItem.responseStatus !== 405
            ) {
              await generateEndpoint(
                ctx,
                traceItem,
                queryRunner,
                isGraphQl,
                analyzeFunc,
              )
            }
          }

          mlog.time("analyzer.total_analysis", performance.now() - start)
        }
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
