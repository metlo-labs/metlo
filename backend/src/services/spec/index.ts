import { RestMethod } from "../../enums";
import { ApiEndpoint, OpenApiSpec } from "../../../models";
import Error400BadRequest from "../../errors/error-400-bad-request";
import { JSONValue } from "../../types";
import { AppDataSource } from "../../data-source";

export class SpecService {
  static async uploadNewSpec(specObject: JSONValue, fileName: string) {
    const servers: any[] = specObject["servers"];
    const paths: JSONValue = specObject["paths"];

    if (!servers || servers?.length === 0) {
      throw new Error400BadRequest("No servers found in spec file.");
    }

    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    let existingSpec = await openApiSpecRepository.findOneBy({ name: fileName });
    if (!existingSpec) {
      existingSpec = new OpenApiSpec();
      existingSpec.name = fileName;
    }
    existingSpec.spec = JSON.stringify(specObject);
    const pathKeys = Object.keys(paths);
    pathKeys.forEach((path) => {
      const methods = Object.keys(paths[path]);
      methods.forEach((method) => {
        servers.forEach(async (server) => {
          const host = server["url"];
          if (host) {
            const methodEnum = method.toUpperCase() as RestMethod;
            const existingEndpoint = await apiEndpointRepository.findOneBy({ path, method: methodEnum, host});
            if (!existingEndpoint) {
              const apiEndpoint = new ApiEndpoint();
              apiEndpoint.path = path;
              apiEndpoint.method = methodEnum;
              apiEndpoint.host = host;
              apiEndpoint.openapiSpecName = fileName;
              await apiEndpointRepository.save(apiEndpoint);
            }
          }
        });
      });
    });
    await openApiSpecRepository.save(existingSpec);
  }
}
