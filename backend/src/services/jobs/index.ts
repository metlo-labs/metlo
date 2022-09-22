import { FindOptionsWhere, IsNull, LessThan, MoreThan, Not, Raw } from "typeorm"
import { v4 as uuidv4 } from "uuid"
import { DateTime } from "luxon"
import {
  getDataType,
  getRiskScore,
  isParameter,
  isSuspectedParamater,
  parsedJson,
  parsedJsonNonNull,
} from "utils"
import { ApiEndpoint, ApiTrace, OpenApiSpec, Alert } from "models"
import { AppDataSource } from "data-source"
import { AlertType, DataType, RestMethod, SpecExtension } from "@common/enums"
import { getPathTokens } from "@common/utils"
import { AlertService } from "services/alert"
import { DataFieldService } from "services/data-field"
import { DatabaseService } from "services/database"
import axios from "axios"

interface GenerateEndpoint {
  parameterizedPath: string
  host: string
  regex: string
  method: RestMethod
  traces: ApiTrace[]
}

enum In {
  QUERY = "query",
  HEADER = "header",
  PATH = "path",
  COOKIE = "cookie",
}

interface BodySchema {
  type?: DataType
  items?: BodySchema
  properties?: Record<string, BodySchema>
}

interface BodyContent {
  [key: string]: { schema?: BodySchema }
}

interface Responses {
  [key: string]: {
    description: string
    headers?: BodyContent
    content?: BodyContent
  }
}

export class JobsService {
  static parseSchema(bodySchema: BodySchema, parsedBody: any) {
    const dataType = getDataType(parsedBody)
    if (dataType === DataType.OBJECT) {
      for (let property in parsedBody) {
        bodySchema = {
          type: DataType.OBJECT,
          properties: {
            ...bodySchema?.properties,
            [property]: this.parseSchema(
              bodySchema?.properties?.[property],
              parsedBody[property],
            ),
          },
        }
      }
      return bodySchema
    } else if (dataType === DataType.ARRAY) {
      bodySchema = {
        type: DataType.ARRAY,
        items: this.parseSchema(bodySchema?.items, parsedBody[0] ?? ""),
      }
      return bodySchema
    } else {
      return {
        type: dataType,
      }
    }
  }

  static parseContent(bodySpec: BodyContent, bodyString: string, key: string) {
    let parsedBody = parsedJson(bodyString)
    let nonNullKey: string
    if (!parsedBody && bodyString) {
      nonNullKey = key || "text/plain"
      parsedBody = bodyString
    } else if (parsedBody) {
      const dataType = getDataType(parsedBody)
      nonNullKey =
        key ||
        (dataType === DataType.OBJECT ? "application/json" : "text/plain")
    } else {
      return
    }
    if (!bodySpec?.[nonNullKey]) {
      bodySpec[nonNullKey] = { schema: {} }
    }
    bodySpec[nonNullKey] = {
      schema: this.parseSchema(bodySpec[nonNullKey].schema, parsedBody),
    }
  }

  static async clearApiTraces(): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    try {
      const now = DateTime.now().startOf("hour")
      const oneHourAgo = now.minus({ hours: 1 }).toJSDate()

      const deleteTracesQb = queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(ApiTrace)
        .where('"apiEndpointUuid" IS NOT NULL')
        .andWhere('"createdAt" < :oneHourAgo', { oneHourAgo })

      const aggregateTracesDataHourlyQb = await queryRunner.manager
        .createQueryBuilder(ApiTrace, "trace")
        .select([
          '"apiEndpointUuid"',
          `DATE_TRUNC('hour', "createdAt") as hour`,
          'COUNT(*) as "numTraces"',
        ])
        .where('"apiEndpointUuid" IS NOT NULL')
        .andWhere('"createdAt" < :oneHourAgo', { oneHourAgo })
        .groupBy('"apiEndpointUuid"')
        .addGroupBy("hour")

      const tracesBySecondStatus = `
        WITH traces_by_second_status AS (
          SELECT
            "apiEndpointUuid",
            DATE_TRUNC('second', traces."createdAt") as second,
            "responseStatus" as status,
            COUNT(*) as "numTraces"
          FROM api_trace traces
          WHERE
            "apiEndpointUuid" IS NOT NULL
            AND "createdAt" < $1
          GROUP BY 1, 2, 3
        )
      `
      const tracesByMinuteStatus = `
        traces_by_minute_status AS (
          SELECT
            "apiEndpointUuid",
            DATE_TRUNC('minute', second) as minute,
            status,
            SUM("numTraces") as "numTraces"
          FROM traces_by_second_status
          GROUP BY 1, 2, 3
        )
      `
      const tracesByMinute = `
        traces_by_minute AS (
          SELECT
            "apiEndpointUuid",
            DATE_TRUNC('minute', second) as minute,
            MAX("numTraces") as "maxRPS",
            MIN("numTraces") as "minRPS",
            AVG("numTraces") as "meanRPS",
            SUM("numTraces") as "numTraces",
            COUNT(*) as num_secs_with_data
          FROM traces_by_second_status
          GROUP BY 1, 2
        )
      `
      const minuteCountByStatusCode = `
        minute_count_by_status_code AS (
          SELECT
            "apiEndpointUuid",
            minute,
            replace(
              array_to_string(array_agg(json_build_object(status, "numTraces")), ''),
              '}{',
              ', '
            )::json AS "countByStatusCode"
          FROM traces_by_minute_status
          GROUP BY 1, 2
        )
      `
      const aggregateTracesDataMinutelyQuery = `
        ${tracesBySecondStatus},
        ${tracesByMinuteStatus},
        ${tracesByMinute},
        ${minuteCountByStatusCode}
        SELECT
          traces."apiEndpointUuid",
          traces.minute,
          traces."maxRPS",
          CASE WHEN traces.num_secs_with_data < 60 THEN 0 ELSE traces."minRPS" END as "minRPS",
          traces."meanRPS",
          traces."numTraces",
          status_code_map."countByStatusCode"
        FROM traces_by_minute traces
        JOIN minute_count_by_status_code status_code_map ON
          traces.minute = status_code_map.minute AND traces."apiEndpointUuid" = status_code_map."apiEndpointUuid"
      `

      const aggregateTracesDataMinutely: any[] = await queryRunner.query(
        aggregateTracesDataMinutelyQuery,
        [oneHourAgo],
      )
      const parametersMinutely: any[] = []
      const argArrayMinutely: string[] = []
      let argNumber = 1
      aggregateTracesDataMinutely.forEach(data => {
        parametersMinutely.push(
          uuidv4(),
          data.numTraces,
          data.minute,
          data.maxRPS,
          data.minRPS,
          data.meanRPS,
          data.countByStatusCode,
          data.apiEndpointUuid,
        )
        argArrayMinutely.push(
          `($${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++})`,
        )
      })

      const aggregateTracesDataHourly =
        await aggregateTracesDataHourlyQb.getRawMany()
      const parametersHourly: any[] = []
      const argArrayHourly: string[] = []
      argNumber = 1
      aggregateTracesDataHourly.forEach(data => {
        parametersHourly.push(
          uuidv4(),
          data.numTraces,
          data.hour,
          data.apiEndpointUuid,
        )
        argArrayHourly.push(
          `($${argNumber++}, $${argNumber++}, $${argNumber++}, $${argNumber++})`,
        )
      })

      const argStringMinutely = argArrayMinutely.join(",")
      const insertQueryMinutely = `
        INSERT INTO aggregate_trace_data_minutely ("uuid", "numCalls", "minute", "maxRPS", "minRPS", "meanRPS", "countByStatusCode", "apiEndpointUuid")
        VALUES ${argStringMinutely}
        ON CONFLICT ON CONSTRAINT unique_constraint_minutely
        DO UPDATE SET "numCalls" = EXCLUDED."numCalls" + aggregate_trace_data_minutely."numCalls";
      `
      const argStringHourly = argArrayHourly.join(",")
      const insertQueryHourly = `
        INSERT INTO aggregate_trace_data_hourly ("uuid", "numCalls", "hour", "apiEndpointUuid")
        VALUES ${argStringHourly}
        ON CONFLICT ON CONSTRAINT unique_constraint_hourly
        DO UPDATE SET "numCalls" = EXCLUDED."numCalls" + aggregate_trace_data_hourly."numCalls";
      `
      await deleteTracesQb.execute()
      if (parametersMinutely.length > 0) {
        await queryRunner.query(insertQueryMinutely, parametersMinutely)
      }
      if (parametersHourly.length > 0) {
        await queryRunner.query(insertQueryHourly, parametersHourly)
      }
    } catch (err) {
      console.error(`Encountered error while clearing trace data: ${err}`)
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner?.release()
    }
  }

  static async generateEndpointsFromTraces(): Promise<void> {
    try {
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const regexToTracesMap: Record<string, GenerateEndpoint> = {}
      const traces = await apiTraceRepository.findBy({
        apiEndpointUuid: IsNull(),
      })
      if (traces?.length > 0) {
        for (let i = 0; i < traces.length; i++) {
          const trace = traces[i]
          const apiEndpoint = await apiEndpointRepository.findOne({
            where: {
              pathRegex: Raw(alias => `:path ~ ${alias}`, {
                path: trace.path,
              }),
              method: trace.method,
              host: trace.host,
            },
            relations: { dataFields: true },
            order: {
              numberParams: "ASC",
            },
          })
          if (apiEndpoint) {
            apiEndpoint.updateDates(trace.createdAt)
            apiEndpoint.totalCalls += 1
            const dataFields = DataFieldService.findAllDataFields(
              trace,
              apiEndpoint,
            )
            trace.apiEndpointUuid = apiEndpoint.uuid
            const sensitiveDataAlerts =
              await AlertService.createDataFieldAlerts(
                dataFields,
                apiEndpoint.uuid,
                apiEndpoint.path,
                trace,
              )
            await DatabaseService.executeTransactions(
              [dataFields, sensitiveDataAlerts, [apiEndpoint], [trace]],
              [],
              true,
            )
          } else {
            let found = false
            const regexes = Object.keys(regexToTracesMap)
            for (let x = 0; x < regexes.length && !found; x++) {
              const regex = regexes[x]
              if (
                RegExp(regex).test(
                  `${trace.host}-${trace.method}-${trace.path}`,
                )
              ) {
                found = true
                regexToTracesMap[regex].traces.push(trace)
              }
            }
            if (!found) {
              const pathTokens = getPathTokens(trace.path)
              let paramNum = 1
              let parameterizedPath = ""
              let pathRegex = String.raw``
              for (let j = 0; j < pathTokens.length; j++) {
                const tokenString = pathTokens[j]
                if (tokenString === "/") {
                  parameterizedPath += "/"
                  pathRegex += "/"
                } else if (tokenString.length > 0) {
                  if (isSuspectedParamater(tokenString)) {
                    parameterizedPath += `/{param${paramNum}}`
                    pathRegex += String.raw`/[^/]+`
                    paramNum += 1
                  } else {
                    parameterizedPath += `/${tokenString}`
                    pathRegex += String.raw`/${tokenString}`
                  }
                }
              }
              if (pathRegex.length > 0) {
                pathRegex = String.raw`^${pathRegex}$`
                const regexKey = `${trace.host}-${trace.method}-${pathRegex}`
                if (regexToTracesMap[regexKey]) {
                  regexToTracesMap[regexKey].traces.push(trace)
                } else {
                  regexToTracesMap[regexKey] = {
                    parameterizedPath,
                    host: trace.host,
                    regex: pathRegex,
                    method: trace.method,
                    traces: [trace],
                  }
                }
              }
            }
          }
        }

        for (const regex in regexToTracesMap) {
          /** Check if endpoint already exists for the trace */
          //const existingEndpoint = await apiEndpointRepository.findOneBy({ pathRegex: value.regex, method: value.method, host: value.host })

          const value = regexToTracesMap[regex]
          const apiEndpoint = new ApiEndpoint()
          apiEndpoint.uuid = uuidv4()
          apiEndpoint.path = value.parameterizedPath
          apiEndpoint.pathRegex = value.regex
          apiEndpoint.host = value.traces[0].host
          apiEndpoint.totalCalls = value.traces.length
          apiEndpoint.method = value.traces[0].method
          apiEndpoint.owner = value.traces[0].owner
          apiEndpoint.dataFields = []

          // TODO: Do something with setting sensitive data classes during iteration of traces and add auto generated open api spec for inferred endpoints
          let sensitiveDataAlerts: Alert[] = []
          for (let i = 0; i < value.traces.length; i++) {
            const trace = value.traces[i]
            apiEndpoint.dataFields = DataFieldService.findAllDataFields(
              trace,
              apiEndpoint,
              true,
            )
            trace.apiEndpoint = apiEndpoint
            apiEndpoint.updateDates(trace.createdAt)
            sensitiveDataAlerts = await AlertService.createDataFieldAlerts(
              apiEndpoint.dataFields,
              apiEndpoint.uuid,
              apiEndpoint.path,
              trace,
              sensitiveDataAlerts,
            )
          }
          apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields)
          const alert = await AlertService.createAlert(
            AlertType.NEW_ENDPOINT,
            apiEndpoint,
          )
          await DatabaseService.executeTransactions(
            [
              [apiEndpoint],
              apiEndpoint.dataFields,
              sensitiveDataAlerts,
              [alert],
              value.traces,
            ],
            [],
            true,
          )
        }
      }
      console.log("Finished Generating Endpoints.")
      await this.generateOpenApiSpec()
    } catch (err) {
      console.error(`Encountered error while generating endpoints: ${err}`)
    }
  }

  static async generateOpenApiSpec(): Promise<void> {
    console.log("Generating OpenAPI Spec Files...")
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const openApiSpecRepository = AppDataSource.getRepository(OpenApiSpec)
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
      const nonSpecEndpoints = await apiEndpointRepository.findBy({
        openapiSpecName: IsNull(),
      })
      const hostMap: Record<string, ApiEndpoint[]> = {}
      const specIntro = {
        openapi: "3.0.0",
        info: {
          title: "OpenAPI 3.0 Spec",
          version: "1.0.0",
          description: "An auto-generated OpenAPI 3.0 specification.",
        },
      }
      for (let i = 0; i < nonSpecEndpoints.length; i++) {
        const endpoint = nonSpecEndpoints[i]
        if (hostMap[endpoint.host]) {
          hostMap[endpoint.host].push(endpoint)
        } else {
          hostMap[endpoint.host] = [endpoint]
        }
      }
      for (const host in hostMap) {
        let spec = await openApiSpecRepository.findOneBy({
          name: `${host}-generated`,
        })
        let openApiSpec = {}
        if (spec) {
          openApiSpec = JSON.parse(spec.spec)
        } else {
          spec = new OpenApiSpec()
          spec.name = `${host}-generated`
          spec.isAutoGenerated = true
          spec.hosts = [host]
          openApiSpec = {
            ...specIntro,
            servers: [
              {
                url: host,
              },
            ],
            paths: {},
          }
        }
        const endpoints = hostMap[host]
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i]
          const paths = openApiSpec["paths"]
          const path = endpoint.path
          const method = endpoint.method.toLowerCase()
          let whereConditions: FindOptionsWhere<ApiTrace> = {
            apiEndpointUuid: endpoint.uuid,
          }
          if (spec.updatedAt) {
            whereConditions = {
              createdAt: MoreThan(spec.updatedAt),
              ...whereConditions,
            }
          }
          const traces = await apiTraceRepository.find({
            where: { ...whereConditions },
            order: { createdAt: "ASC" },
          })
          let parameters: Record<string, BodySchema> = {}
          let requestBodySpec: BodyContent = {}
          let responses: Responses = {}
          if (paths[path]) {
            if (paths[path][method]) {
              const specParameters = paths[path][method]["parameters"] ?? []
              requestBodySpec =
                paths[path][method]["requestBody"]?.["content"] ?? {}
              responses = paths[path][method]["responses"] ?? {}
              for (const parameter of specParameters) {
                parameters[`${parameter?.name}<>${parameter?.in}`] =
                  parameter?.schema ?? {}
              }
            } else {
              paths[path][method] = {}
            }
          } else {
            paths[path] = {
              [method]: {},
            }
          }
          for (const trace of traces) {
            const requestParamters = trace.requestParameters
            const requestHeaders = trace.requestHeaders
            const requestBody = trace.requestBody
            const responseHeaders = trace.responseHeaders
            const responseBody = trace.responseBody
            const responseStatusString =
              trace.responseStatus?.toString() || "default"
            let requestContentType = null
            let responseContentType = null
            const endpointTokens = getPathTokens(endpoint.path)
            const traceTokens = getPathTokens(trace.path)
            for (let i = 0; i < endpointTokens.length; i++) {
              const currToken = endpointTokens[i]
              if (isParameter(currToken)) {
                const key = `${currToken.slice(1, -1)}<>path`
                parameters[key] = this.parseSchema(
                  parameters[key] ?? {},
                  parsedJsonNonNull(traceTokens[i], true),
                )
              }
            }
            for (const requestParameter of requestParamters) {
              const key = `${requestParameter.name}<>query`
              parameters[key] = this.parseSchema(
                parameters[key] ?? {},
                parsedJsonNonNull(requestParameter.value, true),
              )
            }
            for (const requestHeader of requestHeaders) {
              const key = `${requestHeader.name}<>header`
              parameters[key] = this.parseSchema(
                parameters[key] ?? {},
                parsedJsonNonNull(requestHeader.value, true),
              )
              if (requestHeader.name.toLowerCase() === "content-type") {
                requestContentType = requestHeader.value.toLowerCase()
              }
            }
            for (const responseHeader of responseHeaders) {
              if (responseHeader.name.toLowerCase() === "content-type") {
                responseContentType = responseHeader.value.toLowerCase()
              }
              if (!responses[responseStatusString]?.headers) {
                responses[responseStatusString] = {
                  description: `${responseStatusString} description`,
                  ...responses[responseStatusString],
                  headers: {},
                }
              }
              this.parseContent(
                responses[responseStatusString]?.headers,
                responseHeader.value,
                responseHeader.name,
              )
            }

            // Request body only for put, post, options, patch, trace
            this.parseContent(requestBodySpec, requestBody, requestContentType)
            if (responseBody) {
              if (!responses[responseStatusString]?.content) {
                responses[responseStatusString] = {
                  description: `${responseStatusString} description`,
                  ...responses[responseStatusString],
                  content: {},
                }
              }
              this.parseContent(
                responses[responseStatusString]?.content,
                responseBody,
                responseContentType,
              )
            }
          }
          let specParameterList = []
          for (const parameter in parameters) {
            const splitParameter = parameter.split("<>")
            specParameterList.push({
              name: splitParameter[0],
              in: splitParameter[1],
              schema: parameters[parameter],
            })
          }
          if (specParameterList.length > 0) {
            paths[path][method]["parameters"] = specParameterList
          }
          if (Object.keys(requestBodySpec).length > 0) {
            paths[path][method]["requestBody"] = {
              content: {
                ...requestBodySpec,
              },
            }
          }
          if (Object.keys(responses).length > 0) {
            paths[path][method]["responses"] = {
              ...responses,
            }
          }

          // Add endpoint path parameters to parameter list
          endpoint.openapiSpec = spec
        }
        spec.spec = JSON.stringify(openApiSpec, null, 2)
        spec.extension = SpecExtension.JSON
        await DatabaseService.executeTransactions([[spec], endpoints], [], true)
      }
    } catch (err) {
      console.error(`Encountered error while generating OpenAPI specs: ${err}`)
    }
  }

  static async monitorEndpointForHSTS(): Promise<void> {
    try {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint)
      const apiTraceRepository = AppDataSource.getRepository(ApiTrace)
      const alertsRepository = AppDataSource.getRepository(Alert)

      const alertableData: Array<[ApiEndpoint, ApiTrace, string]> = []

      for (const endpoint of await apiEndpointRepository
        .createQueryBuilder()
        .getMany()) {
        const latest_trace_for_endpoint = await apiTraceRepository.findOne({
          where: { apiEndpointUuid: endpoint.uuid },
          order: { createdAt: "DESC" },
        })
        if (
          !latest_trace_for_endpoint.responseHeaders.find(v =>
            v.name.includes("Strict-Transport-Security"),
          )
        ) {
          try {
            let options_req = await axios.options(
              new URL(
                `http://${latest_trace_for_endpoint.host}${latest_trace_for_endpoint.path}`,
              ).href,
              {
                validateStatus: code => true,
              },
            )
            console.log(options_req.headers)
            if (
              !Object.keys(options_req.headers).includes(
                "Strict-Transport-Security",
              )
            ) {
              alertableData.push([
                endpoint,
                latest_trace_for_endpoint,
                `Found endpoint possibly missing SSL on ${endpoint.path}`,
              ])
            }
          } catch (err) {
            console.log(
              `Couldn't perform OPTIONS request for endpoint ${endpoint.host}${endpoint.path}: ${err.message}`,
            )
          }
        }
      }
      let alerts = await AlertService.createMissingHSTSAlert(alertableData)
      await alertsRepository.save(alerts)
    } catch (err) {
      console.error(
        `Encountered error while looking for HSTS enabled endpoints : ${err}`,
      )
    }
  }
}
