import validator from "validator"
import { FindOptionsWhere, ILike, Not } from "typeorm"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"
import { ApiEndpoint, AuthenticationConfig, DataField } from "models"
import { GenTestEndpoint } from "@metlo/testing"
import { DataSection, RestMethod } from "@common/enums"
import Error400BadRequest from "errors/error-400-bad-request"

export const getGenTestEndpoint = async (
  ctx: MetloContext,
  endpoint: string,
  host?: string,
  method?: string,
  operationPath?: string,
): Promise<GenTestEndpoint | null> => {
  let endpointObj: ApiEndpoint | null = null
  const apiEndpointRepository = getRepository(ctx, ApiEndpoint)
  if (validator.isUUID(endpoint)) {
    endpointObj = await apiEndpointRepository.findOne({
      where: { uuid: endpoint },
    })
  } else {
    endpointObj = await apiEndpointRepository.findOne({
      where: { path: endpoint, host: host, method: method as RestMethod },
    })
  }
  if (!endpointObj) {
    return null
  }

  if (endpointObj.isGraphQl && !operationPath) {
    throw new Error400BadRequest(
      "Must specify operation path for graphql endpoint",
    )
  }
  let where: FindOptionsWhere<DataField> | FindOptionsWhere<DataField>[] = {
    apiEndpointUuid: endpointObj.uuid,
  }
  if (endpointObj.isGraphQl) {
    where = [
      {
        apiEndpointUuid: endpointObj.uuid,
        dataSection: Not(DataSection.REQUEST_BODY),
      },
      {
        apiEndpointUuid: endpointObj.uuid,
        dataSection: DataSection.REQUEST_BODY,
        dataPath: ILike(`%${operationPath}%`),
      },
    ]
  }
  endpointObj.dataFields = await getRepository(ctx, DataField).find({
    where,
    order: { updatedAt: "ASC" },
  })

  let genTestEndpoint: GenTestEndpoint = {
    host: endpointObj.host,
    path: endpointObj.path,
    method: endpointObj.method,
    isGraphQl: endpointObj.isGraphQl,
    graphQlMetadata: endpointObj.graphQlMetadata,
    graphQlSchema: endpointObj.graphQlSchema,
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
