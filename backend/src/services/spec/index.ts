import { v4 as uuidv4 } from "uuid";
import { Not } from "typeorm";
import yaml from "js-yaml";
import OpenAPIRequestValidator, {
  OpenAPIRequestValidatorError,
} from "openapi-request-validator";
import OpenAPIResponseValidator, {
  OpenAPIResponseValidatorError,
  OpenAPIResponseValidatorValidationError,
} from "openapi-response-validator";
import { AlertType, RestMethod, SpecExtension } from "@common/enums";
import { ApiEndpoint, ApiTrace, MatchedDataClass, OpenApiSpec } from "models";
import Error400BadRequest from "errors/error-400-bad-request";
import { JSONValue, OpenApiSpec as OpenApiSpecResponse } from "@common/types";
import { AppDataSource } from "data-source";
import { getPathRegex, parsedJsonNonNull } from "utils";
import Error409Conflict from "errors/error-409-conflict";
import {
  generateAlertMessageFromReqErrors,
  generateAlertMessageFromRespErrors,
  getHostsFromServer,
  getSpecRequestParameters,
  getSpecResponses,
} from "./utils";
import { AlertService } from "services/alert";

export class SpecService {
  static async getSpec(specName: string): Promise<OpenApiSpecResponse> {
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const spec = await openApiSpecRepository.findOneBy({ name: specName });
    return spec;
  }

  static async getSpecs(): Promise<OpenApiSpecResponse[]> {
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const specList = await openApiSpecRepository.find({
      order: { updatedAt: "DESC" },
    });
    return specList;
  }

  static async updateSpec(
    specObject: JSONValue,
    fileName: string,
    extension: SpecExtension,
    specString: string
  ): Promise<void> {
    await this.deleteSpec(fileName);
    await this.uploadNewSpec(specObject, fileName, extension, specString);
  }

  static async deleteSpec(fileName: string): Promise<void> {
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

  static async uploadNewSpec(
    specObject: JSONValue,
    fileName: string,
    extension: SpecExtension,
    specString: string
  ): Promise<void> {
    const serversRoot: any[] = specObject["servers"];
    const paths: JSONValue = specObject["paths"];

    const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
    const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
    const apiTraceRepository = AppDataSource.getRepository(ApiTrace);
    const matchedDataClassRepository =
      AppDataSource.getRepository(MatchedDataClass);
    let existingSpec = await openApiSpecRepository.findOneBy({
      name: fileName,
    });
    if (!existingSpec) {
      existingSpec = new OpenApiSpec();
      existingSpec.name = fileName;
      existingSpec.extension = extension;
    }
    existingSpec.spec = specString;
    const pathKeys = Object.keys(paths);
    const endpoints: {
      similarEndpoints: ApiEndpoint[];
      apiEndpoints: ApiEndpoint[];
      traces: ApiTrace[];
      matchedDataClasses: MatchedDataClass[];
    } = {
      similarEndpoints: [],
      apiEndpoints: [],
      traces: [],
      matchedDataClasses: [],
    };
    let specHosts: Set<string> = new Set();
    for (const path of pathKeys) {
      let serversPath = serversRoot;
      if (paths[path]["servers"]) {
        serversPath = paths[path]["servers"];
      }
      const pathRegex = getPathRegex(path);
      const methods = Object.keys(paths[path]).filter((key) =>
        Object.values(RestMethod).includes(key.toUpperCase() as RestMethod)
      );
      for (const method of methods) {
        let serversMethod = serversPath;
        if (paths[path][method]["servers"]) {
          serversMethod = paths[path][method]["servers"];
        }
        if (!serversMethod) {
          throw new Error400BadRequest("No servers found in spec file.");
        }
        const hosts = getHostsFromServer(serversMethod);
        specHosts = new Set([...specHosts, ...hosts]);
        for (const host of hosts) {
          // For exact endpoint match
          let updated = false;
          const methodEnum = method.toUpperCase() as RestMethod;
          let apiEndpoint = await apiEndpointRepository.findOne({
            where: {
              path,
              method: methodEnum,
              host,
            },
            relations: { openapiSpec: true },
          });
          if (!apiEndpoint) {
            apiEndpoint = new ApiEndpoint();
            apiEndpoint.uuid = uuidv4();
            apiEndpoint.path = path;
            apiEndpoint.pathRegex = pathRegex;
            apiEndpoint.method = methodEnum;
            apiEndpoint.host = host;
            apiEndpoint.totalCalls = 0;
            apiEndpoint.openapiSpec = existingSpec;
            //await apiEndpointRepository.save(apiEndpoint);
            updated = true;
          } else if (
            apiEndpoint &&
            (!apiEndpoint.openapiSpecName ||
              apiEndpoint.openapiSpec?.isAutoGenerated)
          ) {
            apiEndpoint.openapiSpec = existingSpec;
            //await apiEndpointRepository.save(apiEndpoint);
            updated = true;
          } else {
            throw new Error409Conflict(
              `Path ${apiEndpoint.path} defined in the given new spec file is already defined in another user defined spec file: ${apiEndpoint.openapiSpecName}`
            );
          }
          endpoints.apiEndpoints.push(apiEndpoint);
          //TODO: For endpoints where path regex matches, update traces to point to new Spec defined endpoint
          if (updated) {
            const similarEndpoints = await apiEndpointRepository.find({
              where: {
                path: Not(path),
                pathRegex,
                method: methodEnum,
                host,
              },
              relations: {
                sensitiveDataClasses: true,
              },
            });
            similarEndpoints.forEach(async (endpoint) => {
              apiEndpoint.totalCalls += endpoint.totalCalls;
              apiEndpoint.riskScore = endpoint.riskScore;
              const traces = await apiTraceRepository.findBy({
                apiEndpointUuid: endpoint.uuid,
              });
              endpoint.sensitiveDataClasses.forEach((matchedDataClass) => {
                matchedDataClass.apiEndpoint = apiEndpoint;
              });
              traces.forEach((trace) => {
                trace.apiEndpointUuid = apiEndpoint.uuid;
              });
              //await apiTraceRepository.save(traces);
              endpoints.traces.push(...traces);
              endpoints.matchedDataClasses.push(
                ...endpoint.sensitiveDataClasses
              );
            });
            endpoints.similarEndpoints.push(...similarEndpoints);
            //await apiEndpointRepository.remove(similarEndpoints);
            //await openApiSpecRepository.save(existingSpec);
          }
        }
      }
    }
    existingSpec.hosts = [...specHosts];
    await openApiSpecRepository.save(existingSpec);
    await apiEndpointRepository.save(endpoints.apiEndpoints);
    await apiTraceRepository.save(endpoints.traces);
    await matchedDataClassRepository.save(endpoints.matchedDataClasses);
    await apiEndpointRepository.remove(endpoints.similarEndpoints);
  }

  static async findOpenApiSpecDiff(trace: ApiTrace, endpoint: ApiEndpoint) {
    try {
      const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec);
      const openApiSpec = await openApiSpecRepository.findOneBy({
        name: endpoint.openapiSpecName,
      });
      if (!openApiSpec || openApiSpec?.isAutoGenerated) {
        return;
      }
      const existingUnresolvedAlert = await AlertService.getAlertWithConditions(
        {
          apiEndpointUuid: endpoint.uuid,
          resolved: false,
          type: AlertType.OPEN_API_SPEC_DIFF,
        }
      );
      if (existingUnresolvedAlert) {
        return;
      }
      const specObject: JSONValue = yaml.load(openApiSpec.spec) as JSONValue;
      const specPath: JSONValue =
        specObject["paths"][endpoint.path][endpoint.method.toLowerCase()];

      // Validate request info
      const specRequestParameters = getSpecRequestParameters(
        specObject,
        endpoint
      );
      const requestValidator = new OpenAPIRequestValidator({
        parameters: specRequestParameters,
        requestBody: specPath["requestBody"],
        schemas: specObject["components"]["schemas"],
        errorTransformer: (error, ajvError) => {
          if (ajvError.params["additionalProperty"]) {
            return { ...error, path: ajvError.params["additionalProperty"] };
          }
          return error;
        },
        additionalQueryProperties: false,
        enableHeadersLowercase: false,
      });
      const headers = {};
      const body = parsedJsonNonNull(trace.requestBody);
      const query = {};
      const endpointPathTokens = endpoint.path.split("/");
      const tracePathTokens = trace.path.split("/");
      const pathParams = {};
      for (let i = 0; i < endpointPathTokens.length; i++) {
        const currToken = endpointPathTokens[i];
        if (currToken.startsWith("{") && currToken.endsWith("}")) {
          pathParams[currToken.slice(1, -1)] = tracePathTokens[i];
        }
      }
      trace.requestHeaders.forEach(
        (header) => (headers[header.name] = header.value)
      );
      trace.requestParameters.forEach(
        (parameter) => (query[parameter.name] = parameter.value)
      );
      const traceRequest = {
        headers,
        body,
        query,
        params: pathParams,
      };
      const requestErrors: OpenAPIRequestValidatorError[] =
        requestValidator.validateRequest(traceRequest)?.errors;
      const reqErrorMessages = generateAlertMessageFromReqErrors(requestErrors);

      // Validate response info
      const responses = getSpecResponses(specObject, endpoint);
      const responseValidator = new OpenAPIResponseValidator({
        components: specObject["components"],
        responses: responses,
      });
      const traceStatusCode = trace.responseStatus;
      const traceResponseBody = parsedJsonNonNull(trace.responseBody, true);
      const responseErrors: OpenAPIResponseValidatorValidationError =
        responseValidator.validateResponse(traceStatusCode, traceResponseBody);
      const respErrorMessages = generateAlertMessageFromRespErrors(
        responseErrors?.errors as OpenAPIResponseValidatorError[]
      );

      const errorMessages = [...reqErrorMessages, ...respErrorMessages];
      await AlertService.createAlert(
        AlertType.OPEN_API_SPEC_DIFF,
        endpoint,
        errorMessages
      );
    } catch (err) {
      console.error(`Error finding OpenAPI Spec diff: ${err}`);
    }
  }
}
