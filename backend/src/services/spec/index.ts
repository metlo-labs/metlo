import Error400BadRequest from "../../errors/error-400-bad-request";
import { JSONValue } from "../../types";

export class SpecService {
  static async uploadNewSpec(specObject: JSONValue) {
    const hosts: string[] = [];
    const servers: any[] = specObject["servers"];

    if (!servers || servers?.length === 0) {
      throw new Error400BadRequest("No servers found in spec file.");
    }

    servers.forEach((server) => {
      if (server["url"]) {
        hosts.push(server["url"]);
      }
    });
    console.log(hosts);
  }
}
