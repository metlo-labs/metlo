import { IsNull } from "typeorm"
import { DataSection, DataType, SpecExtension } from "@common/enums"
import { ApiEndpoint, OpenApiSpec, ApiTrace, DataField } from "models"
import { DatabaseService } from "services/database"
import { getPathTokens } from "@common/utils"
import { isParameter, parsedJsonNonNull } from "utils"
import { BodySchema, BodyContent, Responses } from "./types"
import { parseSchema, parseContent } from "./utils"
import {
  getEntityManager,
  getRepoQB,
  getRepository,
  getQB,
} from "services/database/utils"
import { MetloContext } from "types"
import { AppDataSource } from "data-source"

const replacer = (key, value) => {
  if (value instanceof Map) {
    return Object.fromEntries(value)
  } else {
    return value
  }
}

const addRequestBodyDataFieldToSchema = (
  schema: Map<string, any>,
  dataField: DataField,
  mapTokens: string[],
  contentType: string,
) => {
  if (!schema.get(contentType)) {
    schema.set(
      contentType,
      new Map<string, any>([["schema", new Map<string, any>()]]),
    )
  }
  schema = schema.get(contentType).get("schema")
  const arrayFieldDepth = dataField.arrayFields?.[""]
  if (arrayFieldDepth) {
    schema.delete("nullable")
    schema.delete("properties")
    for (let j = 0; j < arrayFieldDepth; j++) {
      if (!schema.get("items")) {
        schema.set("type", DataType.ARRAY)
        schema.set("items", new Map<string, any>())
      }
      schema = schema.get("items")
    }
  }
  if (mapTokens[0]?.length > 0) {
    schema.delete("items")
    schema.delete("nullable")
    if (!schema.get("properties")) {
      schema.set("type", DataType.OBJECT)
      schema.set("properties", new Map<string, any>())
    }
    schema = schema.get("properties")
  }

  addDataFieldToSchema(schema, dataField, mapTokens)
}

const addDataFieldToSchema = (
  schema: Map<string, any>,
  dataField: DataField,
  mapTokens: string[],
) => {
  let curr = schema
  const arrayFieldDepth = dataField.arrayFields?.[""]
  if (arrayFieldDepth) {
    curr.delete("nullable")
    curr.delete("properties")
    for (let j = 0; j < arrayFieldDepth; j++) {
      if (!curr.get("items")) {
        curr.set("type", DataType.ARRAY)
        curr.set("items", new Map<string, any>())
      }
      curr = curr.get("items")
    }
  }
  if (mapTokens.length === 0 || mapTokens[0]?.length === 0) {
    curr.delete("properties")
    curr.delete("items")
    if (dataField.dataType === DataType.UNKNOWN) {
      curr.set("nullable", true)
    } else {
      curr.set("type", dataField.dataType)
    }
    return
  }
  let i: number
  let l = mapTokens.length
  let fullPath = ""
  for (i = 0; i < l; i++) {
    const name = mapTokens[i]
    fullPath = fullPath ? `${fullPath}.${name}` : name
    if (i === l - 1) {
      const arrayFieldDepth = dataField.arrayFields?.[fullPath]
      if (arrayFieldDepth) {
        if (!curr.get(name) || !curr.get(name)?.get("items")) {
          curr.set(
            name,
            new Map<string, any>([
              ["type", DataType.ARRAY],
              ["items", new Map<string, any>()],
            ]),
          )
        }
        curr = curr.get(name).get("items")
        for (let j = 1; j < arrayFieldDepth; j++) {
          if (!curr.get("items")) {
            curr.delete("properties")
            curr.set("type", DataType.ARRAY)
            curr.set("items", new Map<string, any>())
          }
          curr = curr.get("items")
        }
        curr.delete("properties")
        curr.delete("items")
        if (dataField.dataType === DataType.UNKNOWN) {
          curr.set("nullable", true)
        } else {
          curr.set("type", dataField.dataType)
        }
      } else {
        curr.delete("properties")
        curr.delete("items")
        if (dataField.dataType === DataType.UNKNOWN) {
          curr.set(name, new Map<string, any>([["nullable", true]]))
        } else {
          curr.set(name, new Map<string, any>([["type", dataField.dataType]]))
        }
      }
    } else {
      const arrayFieldDepth = dataField.arrayFields?.[fullPath]
      if (arrayFieldDepth) {
        if (!curr.get(name) || !curr.get(name)?.get("items")) {
          curr.set(
            name,
            new Map<string, any>([
              ["type", DataType.ARRAY],
              ["items", new Map<string, any>()],
            ]),
          )
        }
        curr = curr.get(name).get("items")
        for (let j = 1; j < arrayFieldDepth; j++) {
          if (!curr.get("items")) {
            curr.set("type", DataType.ARRAY)
            curr.set("items", new Map<string, any>())
          }
          curr = curr.get("items")
        }
        if (!curr?.get("properties")) {
          curr.set("type", DataType.OBJECT)
          curr.set("properties", new Map<string, any>())
        }
        curr = curr.get("properties")
      } else {
        if (!curr.get(name) || !curr.get(name)?.get("properties")) {
          curr.set(
            name,
            new Map<string, any>([
              ["type", DataType.OBJECT],
              ["properties", new Map<string, any>()],
            ]),
          )
        }
        curr = curr.get(name).get("properties")
      }
    }
  }
}

const generateOpenApiSpec = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const nonSpecEndpoints = await getEntityManager(ctx, queryRunner).find(
      ApiEndpoint,
      { where: { openapiSpecName: IsNull() } },
    )

    const currTime = new Date()
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
      let spec = await getEntityManager(ctx, queryRunner).findOneBy(
        OpenApiSpec,
        {
          name: `${host}-generated`,
        },
      )
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
        const dataFields: DataField[] = await getQB(ctx, queryRunner)
          .from(DataField, "data_field")
          .andWhere(`"apiEndpointUuid" = :endpointId`, {
            endpointId: endpoint.uuid,
          })
          .orderBy(`"updatedAt"`, "ASC")
          .getRawMany()
        const paths = openApiSpec["paths"]
        const path = endpoint.path
        const method = endpoint.method.toLowerCase()

        paths[path] = {
          [method]: {},
        }

        let specParameterList = []
        let reqBodySchema = new Map<string, any>()
        let responses = {}
        let reqHeaderSchema = new Map<string, any>()
        let reqQuerySchema = new Map<string, any>()

        for (const dataField of dataFields) {
          const responseStatus = dataField?.statusCode?.toString()
          let mapTokens = dataField.dataPath?.split(".")
          const contentType = dataField.contentType
          if (dataField.dataSection === DataSection.REQUEST_PATH) {
            specParameterList.push({
              name: dataField.dataPath,
              in: "path",
              schema: {
                type: dataField.dataType,
              },
            })
          } else if (dataField.dataSection === DataSection.REQUEST_HEADER) {
            if (mapTokens[0]?.length > 0) {
              addDataFieldToSchema(reqHeaderSchema, dataField, mapTokens)
            }
          } else if (dataField.dataSection === DataSection.REQUEST_QUERY) {
            if (mapTokens[0]?.length > 0) {
              addDataFieldToSchema(reqQuerySchema, dataField, mapTokens)
            }
          } else if (dataField.dataSection === DataSection.REQUEST_BODY) {
            mapTokens = mapTokens ?? [""]
            if (contentType) {
              addRequestBodyDataFieldToSchema(
                reqBodySchema,
                dataField,
                mapTokens,
                contentType,
              )
            }
          } else if (dataField.dataSection === DataSection.RESPONSE_HEADER) {
            if (mapTokens[0]?.length > 0 && responseStatus) {
              if (!responses[responseStatus]?.headers) {
                responses[responseStatus] = {
                  description: `${responseStatus} description`,
                  ...responses[responseStatus],
                  headers: new Map<string, any>(),
                }
              }
              addDataFieldToSchema(
                responses[responseStatus].headers,
                dataField,
                mapTokens,
              )
            }
          } else if (dataField.dataSection === DataSection.RESPONSE_BODY) {
            mapTokens = mapTokens ?? [""]
            if (contentType && responseStatus) {
              if (!responses[responseStatus]?.content) {
                responses[responseStatus] = {
                  description: `${responseStatus} description`,
                  ...responses[responseStatus],
                  content: new Map<string, any>(),
                }
              }
              addRequestBodyDataFieldToSchema(
                responses[responseStatus].content,
                dataField,
                mapTokens,
                contentType,
              )
            }
          }
        }
        for (const [parameter, schema] of reqQuerySchema) {
          specParameterList.push({
            name: parameter,
            in: "query",
            schema: schema,
          })
        }
        for (const [parameter, schema] of reqHeaderSchema) {
          specParameterList.push({
            name: parameter,
            in: "header",
            schema: schema,
          })
        }
        if (specParameterList.length > 0) {
          paths[path][method]["parameters"] = specParameterList
        }
        if (reqBodySchema.size > 0) {
          paths[path][method]["requestBody"] = {
            content: {
              ...Object.fromEntries(reqBodySchema),
            },
          }
        }
        if (Object.keys(responses).length > 0) {
          paths[path][method]["responses"] = { ...responses }
        }

        endpoint.openapiSpec = spec
      }
      spec.spec = JSON.stringify(openApiSpec, replacer, 2)
      spec.extension = SpecExtension.JSON
      if (!spec.createdAt) {
        spec.createdAt = currTime
      }
      spec.updatedAt = currTime
      spec.specUpdatedAt = currTime
      await DatabaseService.executeTransactions(
        ctx,
        [[spec], endpoints],
        [],
        true,
      )
    }
  } catch (err) {
    console.error(`Encountered error while generating OpenAPI specs: ${err}`)
  } finally {
    await queryRunner.release()
  }
}

export default generateOpenApiSpec
