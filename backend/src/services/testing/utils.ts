import validator from "validator"
import { MetloContext } from "types"
import { getEntityManager, getRepository } from "services/database/utils"
import { ApiEndpoint, AuthenticationConfig } from "models"
import { GenTestEndpoint } from "@metlo/testing"
import { RestMethod } from "@common/enums"
import { getGraphQlSchema } from "services/graphql"
import { AppDataSource } from "data-source"

export const getGenTestEndpoints = async (
  ctx: MetloContext,
  host: string,
): Promise<GenTestEndpoint[]> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpoints = await getEntityManager(ctx, queryRunner).find(
      ApiEndpoint,
      {
        where: { host },
        relations: { dataFields: true },
        order: {
          riskScore: "DESC",
          lastActive: "DESC",
          dataFields: {
            dataSection: "ASC",
            updatedAt: "ASC",
          },
        },
        take: 10,
      },
    )
    if (!endpoints || endpoints?.length === 0) {
      return []
    }
    const authConfig = await getEntityManager(ctx, queryRunner).findOneBy(
      AuthenticationConfig,
      { host },
    )
    const genTestEndpoints: GenTestEndpoint[] = []
    for (const endpoint of endpoints) {
      const graphQlSchema = endpoint.isGraphQl
        ? await getGraphQlSchema(ctx, endpoint)
        : null
      let genTestEndpoint: GenTestEndpoint = {
        uuid: endpoint.uuid,
        host: endpoint.host,
        path: endpoint.path,
        method: endpoint.method,
        isGraphQl: endpoint.isGraphQl,
        graphQlMetadata: endpoint.graphQlMetadata,
        graphQlSchema: graphQlSchema?.schema,
        dataFields: endpoint.dataFields.map(e => ({
          dataSection: e.dataSection,
          contentType: e.contentType,
          dataPath: e.dataPath,
          dataType: e.dataType,
          entity: e.entity,
        })),
      }
      if (authConfig) {
        genTestEndpoint.authConfig = {
          authType: authConfig.authType,
          headerKey: authConfig.headerKey,
          jwtUserPath: authConfig.jwtUserPath,
          cookieName: authConfig.cookieName,
        }
      }
      genTestEndpoints.push(genTestEndpoint)
    }
    return genTestEndpoints
  } catch (err) {
    throw err
  } finally {
    await queryRunner.release()
  }
}

export const getGenTestEndpoint = async (
  ctx: MetloContext,
  endpoint: string,
  host?: string,
  method?: string,
): Promise<GenTestEndpoint | null> => {
  let endpointObj: ApiEndpoint | null = null
  const apiEndpointRepository = getRepository(ctx, ApiEndpoint)
  if (validator.isUUID(endpoint)) {
    endpointObj = await apiEndpointRepository.findOne({
      where: { uuid: endpoint },
      relations: { dataFields: true },
      order: {
        dataFields: {
          dataSection: "ASC",
          updatedAt: "ASC",
        },
      },
    })
  } else {
    endpointObj = await apiEndpointRepository.findOne({
      where: { path: endpoint, host: host, method: method as RestMethod },
      relations: { dataFields: true },
      order: {
        dataFields: {
          dataSection: "ASC",
          updatedAt: "ASC",
        },
      },
    })
  }
  if (!endpointObj) {
    return null
  }
  const graphQlSchema = endpointObj.isGraphQl
    ? await getGraphQlSchema(ctx, endpointObj)
    : null
  let genTestEndpoint: GenTestEndpoint = {
    host: endpointObj.host,
    path: endpointObj.path,
    method: endpointObj.method,
    isGraphQl: endpointObj.isGraphQl,
    graphQlMetadata: endpointObj.graphQlMetadata,
    graphQlSchema: graphQlSchema?.schema,
    dataFields: endpointObj.dataFields.map(e => ({
      dataSection: e.dataSection,
      contentType: e.contentType,
      dataPath: e.dataPath,
      dataType: e.dataType,
      entity: e.entity,
    })),
  }
  const authConfigRepo = getRepository(ctx, AuthenticationConfig)
  const authConfig = await authConfigRepo.findOneBy({
    host: endpointObj.host,
  })
  if (authConfig) {
    genTestEndpoint.authConfig = {
      authType: authConfig.authType,
      headerKey: authConfig.headerKey,
      jwtUserPath: authConfig.jwtUserPath,
      cookieName: authConfig.cookieName,
    }
  }
  return genTestEndpoint
}
