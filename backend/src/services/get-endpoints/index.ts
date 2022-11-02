import { AppDataSource } from "data-source"
import {
  ApiEndpoint,
  ApiEndpointTest,
  ApiTrace,
  AggregateTraceDataHourly,
  Alert,
  DataField,
  OpenApiSpec,
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
ORDER BY
  "dataTag" ASC,
  "dataPath" ASC
`

export class GetEndpointsService {
  static async updateIsAuthenticated(
    apiEndpointUuid: string,
    authenticated: boolean,
  ): Promise<void> {
    await AppDataSource.createQueryBuilder()
      .update(ApiEndpoint)
      .set({ isAuthenticatedUserSet: authenticated })
      .where("uuid = :id", { id: apiEndpointUuid })
      .execute()
  }

  static async updateEndpointRiskScore(
    apiEndpointUuid: string,
  ): Promise<ApiEndpoint> {
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
    const apiEndpoint = await apiEndpointRepository.findOne({
      where: {
        uuid: apiEndpointUuid,
      },
      relations: {
        dataFields: true,
      },
    })
    apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields)
    await apiEndpointRepository.update(
      { uuid: apiEndpointUuid },
      { riskScore: apiEndpoint.riskScore },
    )
    return apiEndpoint
  }

  static async getEndpoints(
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
        getEndpointsQuery(whereFilterString, limitFilter, offsetFilter),
        parameters,
      )
      const countResults = await queryRunner.query(
        getEndpointsCountQuery(whereFilterString),
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
    endpointId: string,
  ): Promise<ApiEndpointDetailedResponse> {
    const queryRunner = AppDataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const endpoint = await queryRunner.manager
        .createQueryBuilder()
        .from(ApiEndpoint, "endpoint")
        .where("uuid = :id", { id: endpointId })
        .getRawOne()
      if (!endpoint) {
        throw new Error404NotFound("Endpoint does not exist.")
      }
      const alerts = await queryRunner.manager
        .createQueryBuilder()
        .select(["uuid", "status"])
        .from(Alert, "alert")
        .where(`"apiEndpointUuid" = :id`, { id: endpointId })
        .getRawMany()
      const dataFields: DataField[] = await queryRunner.query(
        GET_DATA_FIELDS_QUERY,
        [endpointId],
      )
      const openapiSpec = await queryRunner.manager
        .createQueryBuilder()
        .from(OpenApiSpec, "spec")
        .where("name = :name", { name: endpoint.openapiSpecName })
        .getRawOne()
      const traces = await queryRunner.manager.find(ApiTrace, {
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
        take: 100,
      })
      const tests = await queryRunner.manager.find(ApiEndpointTest, {
        where: { apiEndpoint: { uuid: endpointId } },
      })
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

  static async getHosts(): Promise<string[]> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const hosts: { [host: string]: string }[] = await apiEndpointRepository
        .createQueryBuilder("apiEndpoint")
        .select(["host"])
        .distinct(true)
        .getRawMany()
      return hosts.map(host => host["host"])
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }

  static async getUsage(endpointId: string): Promise<UsageResponse[]> {
    try {
      const aggregateTraceDataRepo = AppDataSource.getRepository(
        AggregateTraceDataHourly,
      )
      const usage = await aggregateTraceDataRepo
        .createQueryBuilder("trace")
        .select([`DATE_TRUNC('day', hour) AS date`, `SUM("numCalls") AS count`])
        .where(`"apiEndpointUuid" = :id`, { id: endpointId })
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
