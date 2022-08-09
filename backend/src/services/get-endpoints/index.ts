import { FindManyOptions, FindOptionsWhere, In } from "typeorm";
import { GetEndpointParams } from "types";
import { AppDataSource } from "data-source";
import { ApiEndpoint, ApiTrace } from "models";
import Error500InternalServer from "errors/error-500-internal-server";

export class GetEndpointsService {
  static async getEndpoints(
    getEndpointParams: GetEndpointParams
  ): Promise<[any[], number]> {
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

  static async getEndpoint(endpointId: string): Promise<any> {
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
        take: 20,
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

  static async getHosts() {
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
}
