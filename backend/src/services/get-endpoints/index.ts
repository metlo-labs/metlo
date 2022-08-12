import { FindManyOptions, FindOptionsWhere, In } from "typeorm";
import { AppDataSource } from "data-source";
import { ApiEndpoint, ApiTrace } from "models";
import {
  GetEndpointParams,
  ApiEndpoint as ApiEndpointResponse,
  ApiEndpointDetailed as ApiEndpointDetailedResponse,
  Usage as UsageResponse,
} from "@common/types";
import Error500InternalServer from "errors/error-500-internal-server";

export class GetEndpointsService {
  static async getEndpoints(
    getEndpointParams: GetEndpointParams
  ): Promise<[ApiEndpointResponse[], number]> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
      let whereConditions: FindOptionsWhere<ApiEndpoint> = {};
      let paginationParams: FindManyOptions<ApiEndpoint> = {};
      if (getEndpointParams?.hosts) {
        whereConditions = {
          ...whereConditions,
          host: In(getEndpointParams.hosts),
        };
      }
      if (getEndpointParams?.riskScores) {
        whereConditions = {
          ...whereConditions,
          riskScore: In(getEndpointParams.riskScores),
        };
      }
      if (getEndpointParams?.offset) {
        paginationParams = {
          ...paginationParams,
          skip: getEndpointParams.offset,
        };
      }
      if (getEndpointParams?.limit) {
        paginationParams = {
          ...paginationParams,
          take: getEndpointParams.limit,
        };
      }

      const endpoints = await apiEndpointRepository.findAndCount({
        where: whereConditions,
        ...paginationParams,
      });

      // TODO: Calculate risk score for endpoints and if risk score param present, only return those that meet

      const res: any[] = await Promise.all(
        endpoints[0].map(async (endpoint) => {
          const firstDetected = await apiTraceRepository.findOne({
            where: {
              apiEndpointUuid: endpoint.uuid,
            },
            order: {
              createdAt: "ASC",
            },
          });
          const lastActive = await apiTraceRepository.findOne({
            where: {
              apiEndpointUuid: endpoint.uuid,
            },
            order: {
              createdAt: "DESC",
            },
          });
          return {
            ...endpoint,
            firstDetected: firstDetected?.createdAt,
            lastActive: lastActive?.createdAt,
          };
        })
      );
      return [res, endpoints[1]];
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`);
      throw new Error500InternalServer(err);
    }
  }

  static async getEndpoint(
    endpointId: string
  ): Promise<ApiEndpointDetailedResponse> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
      const endpoint = await apiEndpointRepository.findOne({
        where: { uuid: endpointId },
        relations: {
          sensitiveDataClasses: true,
          openapiSpec: true,
          alerts: true,
        },
      });
      const traces = await apiTraceRepository.find({
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
        take: 100,
      });
      const firstDetected = await apiTraceRepository.findOne({
        where: {
          apiEndpointUuid: endpoint.uuid,
        },
        order: {
          createdAt: "ASC",
        },
      });
      const lastActive = await apiTraceRepository.findOne({
        where: {
          apiEndpointUuid: endpoint.uuid,
        },
        order: {
          createdAt: "DESC",
        },
      });
      return {
        ...endpoint,
        traces: [...traces],
        firstDetected: firstDetected?.createdAt,
        lastActive: lastActive?.createdAt,
      };
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`);
      throw new Error500InternalServer(err);
    }
  }

  static async getHosts(): Promise<string[]> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const hosts: { [host: string]: string }[] = await apiEndpointRepository
        .createQueryBuilder("apiEndpoint")
        .select(["host"])
        .distinct(true)
        .getRawMany();
      return hosts.map((host) => host["host"]);
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`);
      throw new Error500InternalServer(err);
    }
  }

  static async getUsage(endpointId: string): Promise<UsageResponse[]> {
    try {
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
      const usage = await apiTraceRepository
        .createQueryBuilder("trace")
        .select([
          `DATE_TRUNC('day', "createdAt") AS date`,
          `COUNT(uuid) AS count`,
        ])
        .where(`"apiEndpointUuid" = :id`, { id: endpointId })
        .groupBy(`DATE_TRUNC('day', "createdAt")`)
        .orderBy(`date`, "ASC")
        .getRawMany();
      return usage as UsageResponse[];
    } catch (err) {
      console.error(`Error in Get Endpoints service: ${err}`);
      throw new Error500InternalServer(err);
    }
  }
}
