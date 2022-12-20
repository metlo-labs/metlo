import { Brackets } from "typeorm"
import { DataSection, DataType, SpecExtension } from "@common/enums"
import { ApiEndpoint, OpenApiSpec, DataField } from "models"
import { getEntityManager, getQB } from "services/database/utils"
import { MetloContext } from "types"
import { AppDataSource } from "data-source"

const replacer = (key, value) => {
  if (value instanceof Map) {
    return Object.fromEntries(value)
  } else {
    return value
  }
}

const addArrayToSchema = (
  schema: Map<string, any>,
  arrayFieldDepth: number,
  name?: string,
) => {
  if (name) {
    if (!schema.get(name) || !schema.get(name)?.get("items")) {
      schema.set(
        name,
        new Map<string, any>([
          ["type", DataType.ARRAY],
          ["items", new Map<string, any>()],
        ]),
      )
    }
    schema = schema.get(name).get("items")
  }

  for (let j = name ? 1 : 0; j < arrayFieldDepth; j++) {
    schema.delete("nullable")
    schema.delete("properties")
    if (!schema.get("items")) {
      schema.set("type", DataType.ARRAY)
      schema.set("items", new Map<string, any>())
    }
    schema = schema.get("items")
  }
  return schema
}

const addLeafToSchema = (
  schema: Map<string, any>,
  dataType: DataType,
  isNullable: boolean,
  name?: string,
) => {
  if (dataType === DataType.UNKNOWN) {
    if (name) {
      if (!schema.get(name)) {
        schema.set(name, new Map<string, any>())
      }
      schema = schema.get(name)
    }
    schema.delete("properties")
    schema.delete("items")
    schema.set("nullable", true)
  } else {
    if (name) {
      if (!schema.get(name)) {
        schema.set(name, new Map<string, any>())
      }
      schema = schema.get(name)
    }
    schema.delete("properties")
    schema.delete("items")
    if (isNullable) {
      schema.set("nullable", true)
    }
    schema.set("type", dataType)
  }
}

const addObjectToSchema = (schema: Map<string, any>, name?: string) => {
  if (name) {
    if (!schema.get(name) || !schema.get(name)?.get("properties")) {
      schema.set(
        name,
        new Map<string, any>([
          ["type", DataType.OBJECT],
          ["properties", new Map<string, any>()],
        ]),
      )
    }
    schema = schema.get(name).get("properties")
  } else {
    schema.delete("items")
    schema.delete("nullable")
    if (!schema.get("properties")) {
      schema.set("type", DataType.OBJECT)
      schema.set("properties", new Map<string, any>())
    }
    schema = schema.get("properties")
  }
  return schema
}

const addBodyDataFieldToSchema = (
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

  addDataFieldToSchema(schema, dataField, mapTokens, true)
}

const addDataFieldToSchema = (
  schema: Map<string, any>,
  dataField: DataField,
  mapTokens: string[],
  isBody?: boolean,
) => {
  let curr = schema
  const arrayFieldDepth = dataField.arrayFields?.[""]
  if (arrayFieldDepth) {
    curr = addArrayToSchema(curr, arrayFieldDepth)
  }
  if (isBody && mapTokens[0]?.length > 0) {
    curr = addObjectToSchema(curr)
  }
  if (mapTokens.length === 0 || mapTokens[0]?.length === 0) {
    addLeafToSchema(curr, dataField.dataType, dataField.isNullable)
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
        curr = addArrayToSchema(curr, arrayFieldDepth, name)
        addLeafToSchema(curr, dataField.dataType, dataField.isNullable)
      } else {
        addLeafToSchema(curr, dataField.dataType, dataField.isNullable, name)
      }
    } else {
      const arrayFieldDepth = dataField.arrayFields?.[fullPath]
      if (arrayFieldDepth) {
        curr = addArrayToSchema(curr, arrayFieldDepth, name)
        curr = addObjectToSchema(curr)
      } else {
        curr = addObjectToSchema(curr, name)
      }
    }
  }
}

const generateSchemas = (dataFields: DataField[]) => {
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
        addBodyDataFieldToSchema(
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
        addBodyDataFieldToSchema(
          responses[responseStatus].content,
          dataField,
          mapTokens,
          contentType,
        )
      }
    }
  }

  return {
    specParameterList,
    reqHeaderSchema,
    reqQuerySchema,
    reqBodySchema,
    responses,
  }
}

const generateOpenApiSpec = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpointsToUpdate: ApiEndpoint[] = await getQB(ctx, queryRunner)
      .select(["uuid", "host", "path", "method"])
      .from(ApiEndpoint, "endpoint")
      .leftJoin(`endpoint.openapiSpec`, "spec")
      .andWhere(
        new Brackets(qb => {
          qb.where(`endpoint."openapiSpecName" IS NULL`).orWhere(
            `spec."isAutoGenerated" = True`,
          )
        }),
      )
      .getRawMany()

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
    const endpointIds = []

    for (let i = 0; i < endpointsToUpdate.length; i++) {
      const endpoint = endpointsToUpdate[i]
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
          isAutoGenerated: true,
        },
      )
      if (!spec) {
        spec = new OpenApiSpec()
        spec.name = `${host}-generated`
        spec.isAutoGenerated = true
      }
      spec.hosts = [host]
      let openApiSpec = {
        ...specIntro,
        servers: [
          {
            url: host,
          },
        ],
        paths: {},
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

        const {
          specParameterList,
          reqHeaderSchema,
          reqQuerySchema,
          reqBodySchema,
          responses,
        } = generateSchemas(dataFields)

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
          endpointIds.push(endpoint.uuid)
          paths[path][method]["responses"] = { ...responses }
        } else {
          delete paths[path][method]
          if (Object.keys(paths[path]).length === 0) {
            delete paths[path]
          }
        }
      }
      spec.spec = JSON.stringify(openApiSpec, replacer, 2)
      spec.extension = SpecExtension.JSON
      if (!spec.createdAt) {
        spec.createdAt = currTime
      }
      spec.updatedAt = currTime
      spec.specUpdatedAt = currTime

      await getEntityManager(ctx, queryRunner).save(spec)
      if (endpointIds?.length > 0) {
        await getQB(ctx, queryRunner)
          .update(ApiEndpoint)
          .set({ openapiSpecName: spec.name })
          .andWhere("uuid IN(:...ids)", { ids: endpointIds })
          .execute()
      }
    }
  } catch (err) {
    console.error(`Encountered error while generating OpenAPI specs: ${err}`)
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
  } finally {
    await queryRunner.release()
  }
}

export default generateOpenApiSpec
