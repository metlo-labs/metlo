import validator from "validator"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"
import { ApiEndpoint, AuthenticationConfig } from "models"
import { GenTestEndpoint } from "@metlo/testing"
import { RestMethod } from "@common/enums"

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

  let path = endpointObj.path
  if (endpointObj.isGraphQl) {
    const splitPath = path.split("/")
    const graphQlPath = splitPath.pop()
    path = `${splitPath.join("/")}/${graphQlPath.split(".")[0]}`
  }

  let genTestEndpoint: GenTestEndpoint = {
    host: endpointObj.host,
    path,
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
