import { RestMethod } from "@common/enums";
import { ApiEndpoint } from "../../../models";
import Error400BadRequest from "../../errors/error-400-bad-request";
import { JSONValue } from "@common/types";

export class SpecService {
  static async uploadNewSpec(specObject: JSONValue) {
    const hosts: string[] = [];
    const apiEndpoints: ApiEndpoint[] = [];
    const servers: any[] = specObject["servers"];
    const paths: JSONValue = specObject["paths"];

    if (!servers || servers?.length === 0) {
      throw new Error400BadRequest("No servers found in spec file.");
    }

    const pathKeys = Object.keys(paths);
    pathKeys.forEach((path) => {
      const methods = Object.keys(paths[path]);
      methods.forEach((method) => {
        servers.forEach((server) => {
          if (server["url"]) {
            const methodEnum = method.toUpperCase() as RestMethod;
            const apiEndpoint = new ApiEndpoint();
            apiEndpoint.path = path;
            apiEndpoint.method = methodEnum;
            apiEndpoint.host = server["url"];
          }
        });
      });
    });
    console.log(hosts);
  }
}
