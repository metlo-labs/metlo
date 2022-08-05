import { v4 as uuidv4 } from "uuid";
import { Not } from "typeorm";
import { RestMethod } from "../../enums";
import { ApiEndpoint, ApiTrace, OpenApiSpec } from "../../../models";
import Error400BadRequest from "../../errors/error-400-bad-request";
import { JSONValue } from "../../types";
import { AppDataSource } from "../../data-source";
import { getPathRegex } from "../../utils";

export class SpecService {
  static async updateSpec(specObject: JSONValue, fileName: string) {
    await this.deleteSpec(fileName);
    await this.uploadNewSpec(specObject, fileName);
  }

  static async deleteSpec(fileName: string) {
    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);

    const specEndpoints = await apiEndpointRepository.findBy({
      openapiSpecName: fileName,
    });
    const openApiSpec = await openApiSpecRepository.findOneBy({
      name: fileName,
    });
    if (!openApiSpec) {
      throw new Error400BadRequest(
        "No spec file with the provided name exists."
      );
    }
    for (let i = 0; i < specEndpoints.length; i++) {
      const endpoint = specEndpoints[i];
      endpoint.openapiSpecName = null;
    }
    await apiEndpointRepository.save(specEndpoints);
    await openApiSpecRepository.remove(openApiSpec);
  }

  static async uploadNewSpec(specObject: JSONValue, fileName: string) {
    const servers: any[] = specObject["servers"];
    const paths: JSONValue = specObject["paths"];

    if (!servers || servers?.length === 0) {
      throw new Error400BadRequest("No servers found in spec file.");
    }

    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
    let existingSpec = await openApiSpecRepository.findOneBy({
      name: fileName,
    });
    if (!existingSpec) {
      existingSpec = new OpenApiSpec();
      existingSpec.name = fileName;
    }
    existingSpec.spec = JSON.stringify(specObject);
    await openApiSpecRepository.save(existingSpec);
    const pathKeys = Object.keys(paths);
    pathKeys.forEach((path) => {
      const pathRegex = getPathRegex(path);
      const methods = Object.keys(paths[path]);
      methods.forEach((method) => {
        servers.forEach(async (server) => {
          const host = server["url"];
          if (host) {
            // For exact endpoint match
            let updated = false;
            const methodEnum = method.toUpperCase() as RestMethod;
            let apiEndpoint = await apiEndpointRepository.findOneBy({
              path,
              method: methodEnum,
              host,
            });
            if (!apiEndpoint) {
              apiEndpoint = new ApiEndpoint();
              apiEndpoint.uuid = uuidv4();
              apiEndpoint.path = path;
              apiEndpoint.pathRegex = pathRegex;
              apiEndpoint.method = methodEnum;
              apiEndpoint.host = host;
              apiEndpoint.openapiSpecName = fileName;
              await apiEndpointRepository.save(apiEndpoint);
              updated = true;
            } else if (apiEndpoint && !apiEndpoint.openapiSpecName) {
              apiEndpoint.openapiSpecName = fileName;
              await apiEndpointRepository.save(apiEndpoint);
              updated = true;
            }
            //TODO: For endpoints where path regex matches, update traces to point to new Spec defined endpoint
            if (updated) {
              const similarEndpoints = await apiEndpointRepository.findBy({
                path: Not(path),
                pathRegex,
                method: methodEnum,
                host,
              });
              similarEndpoints.forEach(async (endpoint) => {
                const traces = await apiTraceRepository.findBy({
                  apiEndpointUuid: endpoint.uuid,
                });
                traces.forEach((trace) => {
                  trace.apiEndpointUuid = apiEndpoint.uuid;
                });
                await apiTraceRepository.save(traces);
              });
              await apiEndpointRepository.remove(similarEndpoints);
            }
          }
        });
      });
    });
  }
}
