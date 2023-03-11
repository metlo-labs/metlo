import { buildSchema } from "graphql"
import { MetloContext } from "types"
import { getEntityManager, getQB } from "services/database/utils"
import { ApiEndpoint } from "models"
import { AppDataSource } from "data-source"
import Error400BadRequest from "errors/error-400-bad-request"

export const getGraphQlPaths = () => {
  return ["/graphql"]
}

export const isGraphQlEndpoint = (path: string) => {
  const graphQlPaths = getGraphQlPaths()
  return graphQlPaths.some(e => path.endsWith(e))
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
      { select: { isGraphQl: true }, where: { uuid: endpointId } },
    )
    if (!endpoint.isGraphQl) {
      throw new Error400BadRequest(
        "Cannot upload GraphQl schema for non Graphql endpoint",
      )
    }
    buildSchema(schema)
    await getQB(ctx, queryRunner)
      .update(ApiEndpoint)
      .set({ graphQlSchema: schema })
      .andWhere("uuid = :id", { id: endpointId })
      .execute()
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
      { select: { isGraphQl: true }, where: { uuid: endpointId } },
    )
    if (!endpoint.isGraphQl) {
      throw new Error400BadRequest(
        "Cannot delete GraphQl schema for non Graphql endpoint",
      )
    }
    await getQB(ctx, queryRunner)
      .update(ApiEndpoint)
      .set({ graphQlSchema: null })
      .andWhere("uuid = :id", { id: endpointId })
      .execute()
  } catch (err) {
    throw err
  } finally {
    await queryRunner.release()
  }
}
