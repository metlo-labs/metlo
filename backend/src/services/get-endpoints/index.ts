import { AppDataSource } from "data-source"
import { ApiEndpoint, ApiEndpointTest, ApiTrace } from "models"
import {
  GetEndpointParams,
  ApiEndpoint as ApiEndpointResponse,
  ApiEndpointDetailed as ApiEndpointDetailedResponse,
  Usage as UsageResponse,
} from "@common/types"
import Error500InternalServer from "errors/error-500-internal-server"
import { Test } from "@common/testing/types"
import Error404NotFound from "errors/error-404-not-found"
import { getRiskScore } from "utils"
import { FindOptionsWhere, In, Like, Raw } from "typeorm"

export class GetEndpointsService {
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
    return await apiEndpointRepository.save(apiEndpoint)
  }

  static async getEndpoints(
    getEndpointParams: GetEndpointParams,
  ): Promise<[ApiEndpointResponse[], number]> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      let whereConditions: FindOptionsWhere<ApiEndpoint> = {}

      if (getEndpointParams?.hosts) {
        whereConditions = {
          ...whereConditions,
          host: In(getEndpointParams.hosts),
        }
      }
      if (getEndpointParams?.riskScores) {
        whereConditions = {
          ...whereConditions,
          riskScore: In(getEndpointParams.riskScores),
        }
      }
      if (getEndpointParams?.dataClasses) {
        whereConditions = {
          ...whereConditions,
          dataFields: {
            dataClasses: Raw(alias => `${alias} && :filteredClasses`, {
              filteredClasses: getEndpointParams.dataClasses,
            }),
          },
        }
      }
      if (getEndpointParams?.searchQuery) {
        whereConditions = {
          ...whereConditions,
          path: Like(`%${getEndpointParams.searchQuery}%`),
        }
      }

      return await apiEndpointRepository.findAndCount({
        select: {
          dataFields: {
            uuid: true,
            dataClasses: true,
          },
        },
        where: whereConditions,
        relations: {
          dataFields: true,
        },
        order: {
          riskScore: "DESC",
          lastActive: "DESC",
        },
        skip: getEndpointParams?.offset ?? 0,
        take: getEndpointParams?.limit ?? 10,
      })
      /*const endpointsQuery = `
        SELECT endpoints.*, fields.uuid, DISTINCT(fields."dataClasses")
        FROM api_endpoint endpoints
        LEFT JOIN data_field fields ON fields."apiEndpointUuid" = endpoints.uuid
      `
      let endpointsQb = apiEndpointRepository.createQueryBuilder("endpoint")

      if (getEndpointParams?.hosts) {
        endpointsQb = endpointsQb.where("endpoint.host IN (:...hosts)", {
          hosts: getEndpointParams.hosts,
        })
      }
      if (getEndpointParams?.riskScores) {
        endpointsQb = endpointsQb.andWhere(
          "endpoint.riskScore IN (:...scores)",
          { scores: getEndpointParams.riskScores },
        )
      }
      endpointsQb = endpointsQb.orderBy("endpoint.riskScore", "DESC").addOrderBy("endpoint.lastActive", "DESC", "NULLS LAST")
      if (getEndpointParams?.offset) {
        endpointsQb = endpointsQb.offset(getEndpointParams.offset)
      }
      if (getEndpointParams?.limit) {
        endpointsQb = endpointsQb.limit(getEndpointParams.limit)
      }

      const endpoints = await endpointsQb.getManyAndCount()
      return endpoints*/
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
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
      const firstDetected = await apiTraceRepository.findOne({
        select: {
          createdAt: true,
        },
        where: {
          apiEndpointUuid: endpoint.uuid,
        },
        order: {
          createdAt: "ASC",
        },
      })
      const lastActive = await apiTraceRepository.findOne({
        select: {
          createdAt: true,
        },
        where: {
          apiEndpointUuid: endpoint.uuid,
        },
        order: {
          createdAt: "DESC",
        },
      })
      const tests = await apiEndpointTestRepository.find({
        where: { apiEndpoint: { uuid: endpointId } },
      })
      return {
        ...endpoint,
        traces: [...traces],
        tests: tests as Array<Test>,
        firstDetected: firstDetected?.createdAt,
        lastActive: lastActive?.createdAt,
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
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
      const usage = await apiTraceRepository
        .createQueryBuilder("trace")
        .select([
          `DATE_TRUNC('day', "createdAt") AS date`,
          `COUNT(uuid) AS count`,
        ])
        .where(`"apiEndpointUuid" = :id`, { id: endpointId })
        .groupBy(`DATE_TRUNC('day', "createdAt")`)
        .orderBy(`date`, "ASC")
        .getRawMany()
      return usage as UsageResponse[]
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`)
      throw new Error500InternalServer(err)
    }
  }
}
