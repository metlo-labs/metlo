import { buildSchema } from "graphql"
import { QueryRunner } from "typeorm"
import { MetloContext } from "types"
import {
  createQB,
  getEntityManager,
  getQB,
  insertValueBuilder,
} from "services/database/utils"
import { ApiEndpoint, GQLSchema } from "models"
import { AppDataSource } from "data-source"
import Error400BadRequest from "errors/error-400-bad-request"
import Error404NotFound from "errors/error-404-not-found"

export const getGraphQlPaths = () => {
  return ["/graphql"]
}

export const isGraphQlEndpoint = (path: string) => {
  const graphQlPaths = getGraphQlPaths()
  return graphQlPaths.some(e => path.endsWith(e))
}

export const getGraphQlTableEntryName = (
  ctx: MetloContext,
  apiEndpoint: ApiEndpoint,
) => {
  const splitPath = apiEndpoint.path.split("/")
  const graphQlPath = splitPath.pop()
  const path = `${splitPath.join("/")}/${graphQlPath.split(".")[0]}`
  return `${apiEndpoint.host}-${path}`
}

export const getGraphQlTableEntryNameForHost = (
  ctx: MetloContext,
  host: string,
) => {
  return `${host}-`
}

export const getGraphQlSchema = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
  queryRunner?: QueryRunner,
): Promise<GQLSchema> => {
  const name = getGraphQlTableEntryName(ctx, endpoint)
  if (queryRunner) {
    return await getQB(ctx, queryRunner)
      .from(GQLSchema, "gql_schema")
      .andWhere("name = :name", { name })
      .limit(1)
      .getRawOne()
  } else {
    return await createQB(ctx)
      .from(GQLSchema, "gql_schema")
      .andWhere("name = :name", { name })
      .limit(1)
      .getRawOne()
  }
}

export const uploadGraphQlSchema = async (
  ctx: MetloContext,
  schema: string,
  endpointId: string,
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpoint = await getEntityManager(ctx, queryRunner).findOne(
      ApiEndpoint,
      {
        select: { isGraphQl: true, path: true, host: true },
        where: { uuid: endpointId },
      },
    )
    if (!endpoint) {
      throw new Error404NotFound("Endpoint does not exist")
    }
    if (!endpoint.isGraphQl) {
      throw new Error400BadRequest(
        "Cannot upload GraphQl schema for non Graphql endpoint",
      )
    }
    buildSchema(schema)
    const name = getGraphQlTableEntryName(ctx, endpoint)
    const existingSchema = await getEntityManager(ctx, queryRunner).findOne(
      GQLSchema,
      {
        where: { name },
      },
    )
    if (existingSchema) {
      await getQB(ctx, queryRunner)
        .update(GQLSchema)
        .set({ schema })
        .andWhere("name = :name", { name })
        .execute()
    } else {
      const newEntry = new GQLSchema()
      newEntry.name = name
      newEntry.schema = schema
      await insertValueBuilder(ctx, queryRunner, GQLSchema, newEntry).execute()
    }
  } catch (err) {
    throw err
  } finally {
    await queryRunner.release()
  }
}

export const deleteGraphQlSchema = async (
  ctx: MetloContext,
  endpointId: string,
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpoint = await getEntityManager(ctx, queryRunner).findOne(
      ApiEndpoint,
      {
        select: { isGraphQl: true, path: true, host: true },
        where: { uuid: endpointId },
      },
    )
    if (!endpoint) {
      throw new Error404NotFound("Endpoint does not exist")
    }
    if (!endpoint.isGraphQl) {
      throw new Error400BadRequest(
        "Cannot delete GraphQl schema for non Graphql endpoint",
      )
    }
    const name = getGraphQlTableEntryName(ctx, endpoint)
    await getQB(ctx, queryRunner)
      .delete()
      .from(GQLSchema)
      .where("name = :name", { name })
      .execute()
  } catch (err) {
    throw err
  } finally {
    await queryRunner.release()
  }
}

export const deleteGraphQlSchemaFromHost = async (
  ctx: MetloContext,
  host: string,
  queryRunner: QueryRunner,
) => {
  const name = getGraphQlTableEntryNameForHost(ctx, host)
  await getQB(ctx, queryRunner)
    .delete()
    .from(GQLSchema)
    .andWhere("name LIKE :name", { name: `%${name}%` })
    .execute()
}
