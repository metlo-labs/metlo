import { AppDataSource } from "data-source"
import {
  ApiEndpoint,
  ApiEndpointTest,
  ApiTrace,
  AggregateTraceDataHourly,
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
      let whereFilter = ''
      let argNumber = 1
      const parameters = []

      if (getEndpointParams?.hosts) {
        whereFilter += `endpoint.host = ANY($${argNumber++})\n`
        parameters.push(getEndpointParams.hosts)
      }
      if (getEndpointParams?.riskScores) {
        whereFilter += `endpoint."riskScore" = ANY($${argNumber++})\n`
        parameters.push(getEndpointParams.riskScores)
      }
      if (getEndpointParams?.dataClasses) {
        whereFilter += `data_field."dataClasses" && $${argNumber++}\n`
        parameters.push(getEndpointParams.dataClasses)
      }
      if (getEndpointParams?.searchQuery) {
        whereFilter += `endpoint.path ILIKE $${argNumber++}\n`
        parameters.push(`%${getEndpointParams.searchQuery}%`)
      }
      if (getEndpointParams?.isAuthenticatedDetected) {
        const isAuthenticated = getEndpointParams.isAuthenticatedDetected
        if (String(isAuthenticated) === 'true') {
          whereFilter += '(endpoint."isAuthenticatedDetected" = TRUE AND endpoint."isAuthenticatedUserSet" = TRUE)'
        } else {
          whereFilter += '(endpoint."isAuthenticatedDetected" = FALSE OR endpoint."isAuthenticatedUserSet" = FALSE)'
        }
      }
      if (whereFilter.length > 0) {
        whereFilter = `WHERE ${whereFilter}`
      }
      const limitFilter = `LIMIT ${getEndpointParams?.limit ?? 10}`
      const offsetFilter = `OFFSET ${getEndpointParams?.offset ?? 10}`

      const endpointResults = await queryRunner.query(getEndpointsQuery(whereFilter, limitFilter, offsetFilter), parameters)
      const countResults = await queryRunner.query(getEndpointsCountQuery(whereFilter), parameters)

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
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
      const apiEndpointTestRepository =
        AppDataSource.getRepository(ApiEndpointTest)
      const endpoint = await apiEndpointRepository.findOne({
        select: {
          alerts: {
            uuid: true,
            status: true,
          },
        },
        where: { uuid: endpointId },
        relations: {
          dataFields: true,
          openapiSpec: true,
          alerts: true,
        },
        order: {
          dataFields: {
            dataTag: "ASC",
            dataPath: "ASC",
          },
        },
      })
      if (!endpoint) {
        throw new Error404NotFound("Endpoint does not exist.")
      }
      const traces = await apiTraceRepository.find({
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
        take: 100,
      })
      const tests = await apiEndpointTestRepository.find({
        where: { apiEndpoint: { uuid: endpointId } },
      })
      return {
        ...endpoint,
        traces: [...traces],
        tests: tests as Array<Test>,
      }
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
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
