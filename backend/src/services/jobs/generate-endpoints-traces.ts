import mlog from "logger"
import { IsNull, LessThanOrEqual, Raw, FindManyOptions } from "typeorm"
import { v4 as uuidv4 } from "uuid"
import { ApiTrace, ApiEndpoint, Alert } from "models"
import { AppDataSource } from "data-source"
import { AlertType } from "@common/enums"
import { AlertService } from "services/alert"
import { getPathTokens } from "@common/utils"
import { skipAutoGeneratedMatch, isSuspectedParamater } from "utils"
import { GenerateEndpoint } from "./types"
import { retryTypeormTransaction } from "utils/db"
import { MetloContext } from "types"
import {
  getEntityManager,
  getQB,
  insertValueBuilder,
} from "services/database/utils"

const generateEndpointsFromTraces = async (
  ctx: MetloContext,
): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const currTime = new Date()
    const tracesFindOptions: FindManyOptions<ApiTrace> = {
      select: {
        uuid: true,
        path: true,
        method: true,
        host: true,
        createdAt: true,
      },
      where: {
        apiEndpointUuid: IsNull(),
        createdAt: LessThanOrEqual(currTime),
      },
      order: {
        createdAt: "ASC",
      },
      take: 1000,
    }
    let traces = await getEntityManager(ctx, queryRunner).find(
      ApiTrace,
      tracesFindOptions,
    )
    while (traces && traces?.length > 0) {
      const regexToTracesMap: Record<string, GenerateEndpoint> = {}
      for (let i = 0; i < traces.length; i++) {
        const trace = traces[i]
        const apiEndpoint = await getEntityManager(ctx, queryRunner).findOne(
          ApiEndpoint,
          {
            where: {
              pathRegex: Raw(alias => `:path ~ ${alias}`, {
                path: trace.path,
              }),
              method: trace.method,
              host: trace.host,
            },
            relations: { openapiSpec: true },
            order: {
              numberParams: "ASC",
            },
          },
        )
        if (apiEndpoint && !skipAutoGeneratedMatch(apiEndpoint, trace.path)) {
          apiEndpoint.updateDates(trace.createdAt)

          await queryRunner.startTransaction()
          await retryTypeormTransaction(
            () =>
              getQB(ctx, queryRunner)
                .update(ApiTrace)
                .set({ apiEndpointUuid: apiEndpoint.uuid })
                .andWhere("uuid = :id", { id: trace.uuid })
                .execute(),
            5,
          )
          await retryTypeormTransaction(
            () =>
              getQB(ctx, queryRunner)
                .update(ApiEndpoint)
                .set({
                  firstDetected: apiEndpoint.firstDetected,
                  lastActive: apiEndpoint.lastActive,
                })
                .andWhere("uuid = :id", { id: apiEndpoint.uuid })
                .execute(),
            5,
          )
          await queryRunner.commitTransaction()
        } else {
          let found = false
          const regexes = Object.keys(regexToTracesMap)
          for (let x = 0; x < regexes.length && !found; x++) {
            const regex = regexes[x]
            if (
              RegExp(regex).test(`${trace.host}-${trace.method}-${trace.path}`)
            ) {
              found = true
              regexToTracesMap[regex].traces.push(trace)
            }
          }
          if (!found) {
            const pathTokens = getPathTokens(trace.path)
            let paramNum = 1
            let parameterizedPath = ""
            let pathRegex = String.raw``
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
            if (pathRegex.length > 0) {
              pathRegex = String.raw`^${pathRegex}(/)*$`
              const regexKey = `${trace.host}-${trace.method}-${pathRegex}`
              if (regexToTracesMap[regexKey]) {
                regexToTracesMap[regexKey].traces.push(trace)
              } else {
                regexToTracesMap[regexKey] = {
                  parameterizedPath,
                  host: trace.host,
                  regex: pathRegex,
                  method: trace.method,
                  traces: [trace],
                }
              }
            }
          }
        }
      }

      for (const regex in regexToTracesMap) {
        const value = regexToTracesMap[regex]
        const apiEndpoint = new ApiEndpoint()
        apiEndpoint.uuid = uuidv4()
        apiEndpoint.path = value.parameterizedPath
        apiEndpoint.pathRegex = value.regex
        apiEndpoint.host = value.traces[0].host
        apiEndpoint.method = value.traces[0].method
        apiEndpoint.addNumberParams()

        const traceIds = []
        for (let i = 0; i < value.traces.length; i++) {
          const trace = value.traces[i]
          apiEndpoint.updateDates(trace.createdAt)
          traceIds.push(trace.uuid)
        }
        const alert = await AlertService.createAlert(
          ctx,
          AlertType.NEW_ENDPOINT,
          apiEndpoint,
        )

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
        await retryTypeormTransaction(
          () => insertValueBuilder(ctx, queryRunner, Alert, alert).execute(),
          5,
        )
        await retryTypeormTransaction(
          () =>
            getQB(ctx, queryRunner)
              .update(ApiTrace)
              .set({ apiEndpointUuid: apiEndpoint.uuid })
              .andWhere("uuid IN(:...ids)", { ids: traceIds })
              .execute(),
          5,
        )
        await queryRunner.commitTransaction()
      }
      traces = await getEntityManager(ctx, queryRunner).find(
        ApiTrace,
        tracesFindOptions,
      )
    }
    mlog.info("Finished Generating Endpoints.")
  } catch (err) {
    mlog.withErr(err).error("Encountered error while generating endpoints")
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner?.release()
  }
}

export default generateEndpointsFromTraces
