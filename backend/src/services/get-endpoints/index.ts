import { FindManyOptions, FindOptionsWhere, In } from "typeorm";
import { GetEndpointParams } from "../../types";
import { AppDataSource } from "../../data-source";
import { ApiEndpoint, ApiTrace } from "../../../models";
import Error500InternalServer from "../../errors/error-500-internal-server";

export class GetEndpointsService {
  static async getEndpoints(
    getEndpointParams: GetEndpointParams
  ): Promise<[ApiEndpoint[], number]> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      let whereConditions: FindOptionsWhere<ApiEndpoint> = {};
      let paginationParams: FindManyOptions<ApiEndpoint> = {};
      if (getEndpointParams?.hosts) {
        whereConditions = {
          ...whereConditions,
          host: In(getEndpointParams.hosts),
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

      return endpoints;
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
        relations: { sensitiveDataClasses: true, openapiSpec: true },
      });
      const traces = await apiTraceRepository.find({
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
        take: 10,
      });
      return {
        ...endpoint,
        alerts: [],
        traces: [...traces],
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
