import { QueryRunner } from "typeorm"
import { AppDataSource } from "data-source"
import {
  ApiEndpoint,
  ApiEndpointTest,
  ApiTrace,
  AggregateTraceDataHourly,
  Alert,
  DataField,
  OpenApiSpec,
  Attack,
} from "models"
import {
  GetEndpointParams,
  ApiEndpoint as ApiEndpointResponse,
  ApiEndpointDetailed as ApiEndpointDetailedResponse,
  Usage as UsageResponse,
} from "@common/types"
import Error500InternalServer from "errors/error-500-internal-server"
import { Test } from "@metlo/testing"
import Error404NotFound from "errors/error-404-not-found"
import { getRiskScore } from "utils"
import { getEndpointsCountQuery, getEndpointsQuery } from "./queries"
import {
  createQB,
  getEntityManager,
  getQB,
  getRepoQB,
  getRepository,
} from "services/database/utils"
import { MetloContext } from "types"

const getDataFieldsQuery = (ctx: MetloContext) => `
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
FROM ${DataField.getTableName(ctx)} data_field 
WHERE
  "apiEndpointUuid" = $1
ORDER BY
  "dataTag" ASC,
  "dataPath" ASC
`

export class GetEndpointsService {
  static async deleteEndpoint(
    ctx: MetloContext,
    apiEndpointUuid: string,
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const endpoint = await getEntityManager(ctx, queryRunner).findOneBy(
        ApiEndpoint,
        { uuid: apiEndpointUuid },
      )
      if (!endpoint) {
        throw new Error404NotFound("Endpoint not found.")
      }
      await queryRunner.startTransaction()
      await getQB(ctx, queryRunner)
        .delete()
        .from(AggregateTraceDataHourly)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(Alert)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(ApiEndpointTest)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(ApiTrace)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(Attack)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(DataField)
        .andWhere(`"apiEndpointUuid" = :id`, { id: apiEndpointUuid })
        .execute()
      await getQB(ctx, queryRunner)
        .delete()
        .from(ApiEndpoint)
        .andWhere("uuid = :id", { id: apiEndpointUuid })
        .execute()
      await queryRunner.commitTransaction()
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  static async deleteEndpointsBatch(
    ctx: MetloContext,
    apiEndpointUuids: string[],
    queryRunner: QueryRunner,
  ): Promise<void> {
    await getQB(ctx, queryRunner)
      .delete()
      .from(AggregateTraceDataHourly)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(Alert)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(ApiEndpointTest)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(ApiTrace)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(Attack)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(DataField)
      .andWhere(`"apiEndpointUuid" IN(:...ids)`, { ids: apiEndpointUuids })
      .execute()
    await getQB(ctx, queryRunner)
      .delete()
      .from(ApiEndpoint)
      .andWhere("uuid IN(:...ids)", { ids: apiEndpointUuids })
      .execute()
  }

  static async deleteHost(ctx: MetloContext, host: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const endpoints = await getQB(ctx, queryRunner)
        .select(["uuid"])
        .from(ApiEndpoint, "endpoint")
        .andWhere("host = :host", { host })
        .getRawMany()
      if (endpoints?.length > 0) {
        await queryRunner.startTransaction()
        await this.deleteEndpointsBatch(
          ctx,
          endpoints?.map(e => e.uuid),
          queryRunner,
        )
        await queryRunner.commitTransaction()
      }
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  static async updateIsAuthenticated(
    ctx: MetloContext,
    apiEndpointUuid: string,
    authenticated: boolean,
  ): Promise<void> {
    const endpoint = await getRepoQB(ctx, ApiEndpoint)
      .andWhere("uuid = :id", { id: apiEndpointUuid })
      .getRawOne()
    if (!endpoint) {
      throw new Error404NotFound("Endpoint does not exist.")
    }
    await createQB(ctx)
      .update(ApiEndpoint)
      .set({ isAuthenticatedUserSet: authenticated })
      .andWhere("uuid = :id", { id: apiEndpointUuid })
      .execute()
  }

  static async updateEndpointRiskScore(
    ctx: MetloContext,
    apiEndpointUuid: string,
  ): Promise<ApiEndpoint> {
    const apiEndpointRepository = getRepository(ctx, ApiEndpoint)
    const apiEndpoint = await apiEndpointRepository.findOne({
      where: {
        uuid: apiEndpointUuid,
      },
      relations: {
        dataFields: true,
      },
    })
    apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields)
    await getRepoQB(ctx, ApiEndpoint)
      .andWhere("uuid = :uuid", { uuid: apiEndpointUuid })
      .update()
      .set({ riskScore: apiEndpoint.riskScore })
      .execute()
    return apiEndpoint
  }

  static async getEndpoints(
    ctx: MetloContext,
    getEndpointParams: GetEndpointParams,
  ): Promise<[ApiEndpointResponse[], number]> {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      let whereFilter = []
      let whereFilterString = ""
      let argNumber = 1
      const parameters = []

      if (getEndpointParams?.hosts) {
        whereFilter.push(`endpoint.host = ANY($${argNumber++})`)
        parameters.push(getEndpointParams.hosts)
      }
      if (getEndpointParams?.riskScores) {
        whereFilter.push(`endpoint."riskScore" = ANY($${argNumber++})`)
        parameters.push(getEndpointParams.riskScores)
      }
      if (getEndpointParams?.dataClasses) {
        whereFilter.push(`data_field."dataClasses" && $${argNumber++}`)
        parameters.push(getEndpointParams.dataClasses)
      }
      if (getEndpointParams?.searchQuery) {
        whereFilter.push(`endpoint.path ILIKE $${argNumber++}`)
        parameters.push(`%${getEndpointParams.searchQuery}%`)
      }
      if (getEndpointParams?.isAuthenticated) {
        const isAuthenticated = getEndpointParams.isAuthenticated
        if (String(isAuthenticated) === "true") {
          whereFilter.push(
            '(endpoint."isAuthenticatedUserSet" = TRUE OR (endpoint."isAuthenticatedDetected" = TRUE AND (endpoint."isAuthenticatedUserSet" IS NULL OR endpoint."isAuthenticatedUserSet" = TRUE)))',
          )
        } else {
          whereFilter.push(
            '(endpoint."isAuthenticatedUserSet" = FALSE OR (endpoint."isAuthenticatedDetected" = FALSE AND (endpoint."isAuthenticatedUserSet" IS NULL OR endpoint."isAuthenticatedUserSet" = FALSE)))',
          )
        }
      }
      if (whereFilter.length > 0) {
        whereFilterString = `WHERE ${whereFilter.join(" AND ")}`
      }
      const limitFilter = `LIMIT ${getEndpointParams?.limit ?? 10}`
      const offsetFilter = `OFFSET ${getEndpointParams?.offset ?? 10}`

      const endpointResults = await queryRunner.query(
        getEndpointsQuery(ctx, whereFilterString, limitFilter, offsetFilter),
        parameters,
      )
      const countResults = await queryRunner.query(
        getEndpointsCountQuery(ctx, whereFilterString),
        parameters,
      )

      return [endpointResults, countResults?.[0]?.count]
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
  }

  static async getEndpoint(
    ctx: MetloContext,
    endpointId: string,
  ): Promise<ApiEndpointDetailedResponse> {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const endpoint = await getQB(ctx, queryRunner)
        .from(ApiEndpoint, "endpoint")
        .andWhere("uuid = :id", { id: endpointId })
        .getRawOne()
      if (!endpoint) {
        throw new Error404NotFound("Endpoint does not exist.")
      }
      const alerts = await getQB(ctx, queryRunner)
        .select(["uuid", "status"])
        .from(Alert, "alert")
        .andWhere(`"apiEndpointUuid" = :id`, { id: endpointId })
        .getRawMany()
      const dataFields: DataField[] = await queryRunner.query(
        getDataFieldsQuery(ctx),
        [endpointId],
      )
      const openapiSpec = await getQB(ctx, queryRunner)
        .from(OpenApiSpec, "spec")
        .andWhere("name = :name", { name: endpoint.openapiSpecName })
        .getRawOne()
      const traces = await getEntityManager(ctx, queryRunner).find(ApiTrace, {
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
        take: 100,
      })
      const tests = await getEntityManager(ctx, queryRunner).find(
        ApiEndpointTest,
        {
          where: { apiEndpoint: { uuid: endpointId } },
        },
      )
      return {
        ...endpoint,
        alerts,
        dataFields,
        openapiSpec,
        traces: [...traces],
        tests: tests as Array<Test>,
      }
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    } finally {
      await queryRunner.release()
    }
  }

  static async getHosts(ctx: MetloContext): Promise<string[]> {
    try {
      const hosts: { [host: string]: string }[] = await getRepoQB(
        ctx,
        ApiEndpoint,
      )
        .select(["host"])
        .distinct(true)
        .getRawMany()
      return hosts.map(host => host["host"])
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }

  static async getUsage(
    ctx: MetloContext,
    endpointId: string,
  ): Promise<UsageResponse[]> {
    try {
      const endpoint = await getRepoQB(ctx, ApiEndpoint)
        .andWhere("uuid = :id", { id: endpointId })
        .getRawOne()
      if (!endpoint) {
        throw new Error404NotFound("Endpoint does not exist.")
      }
      const usage = await getRepoQB(ctx, AggregateTraceDataHourly, "trace")
        .select([`DATE_TRUNC('day', hour) AS date`, `SUM("numCalls") AS count`])
        .andWhere(`"apiEndpointUuid" = :id`, { id: endpointId })
        .groupBy(`DATE_TRUNC('day', hour)`)
        .orderBy(`date`, "ASC")
        .getRawMany()
      return usage as UsageResponse[]
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }
}
