import { AuthType, DisableRestMethod } from "@common/enums"
import Error400BadRequest from "errors/error-400-bad-request"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"
import Error500InternalServer from "errors/error-500-internal-server"
import mlog from "logger"
import { AuthenticationConfig, BlockFields } from "models"
import { BlockFieldsService } from "services/block-fields"
import { getQB, insertValuesBuilder } from "services/database/utils"
import { QueryRunner } from "typeorm"
import { MetloContext } from "types"
import { getPathRegex, getValidPath } from "utils"
import { RedisClient } from "utils/redis"
import {
  AUTH_CONFIG_LIST_KEY,
  BLOCK_FIELDS_ALL_REGEX,
  BLOCK_FIELDS_LIST_KEY,
} from "~/constants"

const addToBlockFields = (
  blockFieldsEntries: BlockFields[],
  host: string,
  method: DisableRestMethod,
  path: string,
  pathRegex: string,
  disabledPaths: string[],
) => {
  const reqQueryPaths = new Set<string>()
  const reqHeadersPaths = new Set<string>()
  const reqBodyPaths = new Set<string>()
  const resHeadersPaths = new Set<string>()
  const resBodyPaths = new Set<string>()
  disabledPaths.forEach(path => {
    if (path.includes("req.query")) reqQueryPaths.add(path)
    else if (path.includes("req.headers")) reqHeadersPaths.add(path)
    else if (path.includes("req.body")) reqBodyPaths.add(path)
    else if (path.includes("res.headers")) resHeadersPaths.add(path)
    else if (path.includes("res.body")) resBodyPaths.add(path)
  })
  const disabledPathsObj = {
    reqQuery: [...reqQueryPaths],
    reqHeaders: [...reqHeadersPaths],
    reqBody: [...reqBodyPaths],
    resHeaders: [...resHeadersPaths],
    resBody: [...resBodyPaths],
  }
  const blockFieldEntry = BlockFields.create()
  blockFieldEntry.host = host
  blockFieldEntry.method = method
  blockFieldEntry.path = path
  blockFieldEntry.pathRegex = pathRegex
  blockFieldEntry.disabledPaths = disabledPathsObj
  blockFieldEntry.numberParams = BlockFieldsService.getNumberParams(
    pathRegex,
    method,
    path,
  )
  blockFieldsEntries.push(blockFieldEntry)
}

export const populateBlockFields = async (
  ctx: MetloContext,
  metloConfig: object,
  queryRunner: QueryRunner,
) => {
  const blockFieldsDoc = metloConfig?.["blockFields"]
  const blockFieldsEntries: BlockFields[] = []
  const currBlockFieldsEntries = await RedisClient.getValuesFromSet(
    ctx,
    BLOCK_FIELDS_LIST_KEY,
  )
  if (blockFieldsDoc) {
    for (const host in blockFieldsDoc) {
      const hostObj = blockFieldsDoc[host]
      let allDisablePaths = []
      if (hostObj) {
        if (hostObj["ALL"]) {
          allDisablePaths = hostObj["ALL"]["disable_paths"] ?? []
          const pathRegex = BLOCK_FIELDS_ALL_REGEX
          const path = "/"
          addToBlockFields(
            blockFieldsEntries,
            host,
            DisableRestMethod.ALL,
            path,
            pathRegex,
            allDisablePaths,
          )
        }
        for (const endpoint in hostObj) {
          if (endpoint && endpoint !== "ALL") {
            const validPath = getValidPath(endpoint)
            if (!validPath.isValid) {
              throw new Error400BadRequest(`${endpoint}: ${validPath.errMsg}`)
            }
            const validPathString = validPath.path
            const pathRegex = getPathRegex(validPathString)
            let endpointDisablePaths = allDisablePaths
            if (hostObj[endpoint]["ALL"]) {
              endpointDisablePaths = endpointDisablePaths?.concat(
                hostObj[endpoint]["ALL"]["disable_paths"] ?? [],
              )
              addToBlockFields(
                blockFieldsEntries,
                host,
                DisableRestMethod.ALL,
                validPathString,
                pathRegex,
                endpointDisablePaths,
              )
            }
            for (const method in hostObj[endpoint]) {
              if (method && method !== "ALL") {
                const blockFieldMethod = DisableRestMethod[method]
                const disabledPaths = endpointDisablePaths?.concat(
                  hostObj[endpoint][method]?.["disable_paths"] ?? [],
                )
                addToBlockFields(
                  blockFieldsEntries,
                  host,
                  blockFieldMethod,
                  validPathString,
                  pathRegex,
                  disabledPaths,
                )
              }
            }
          }
        }
      }
    }
  }
  await getQB(ctx, queryRunner).delete().from(BlockFields).execute()
  await insertValuesBuilder(
    ctx,
    queryRunner,
    BlockFields,
    blockFieldsEntries,
  ).execute()
  if (currBlockFieldsEntries) {
    await RedisClient.deleteFromRedis(ctx, [
      ...currBlockFieldsEntries,
      BLOCK_FIELDS_LIST_KEY,
    ])
  }
}

export const populateAuthentication = async (
  ctx: MetloContext,
  metloConfig: object,
  queryRunner: QueryRunner,
) => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    mlog.error(`No ENCRYPTION_KEY found. Cannot set authentication config.`)
    throw new Error500InternalServer(
      "No ENCRYPTION_KEY found. Cannot set authentication config.",
    )
  }
  const authConfigDoc = metloConfig?.["authentication"]
  const authConfigEntries: AuthenticationConfig[] = []
  const currAuthConfigEntries = await RedisClient.getValuesFromSet(
    ctx,
    AUTH_CONFIG_LIST_KEY,
  )
  if (authConfigDoc) {
    const hosts = new Set<string>()
    authConfigDoc.forEach(item => {
      if (hosts.has(item.host)) {
        throw new Error422UnprocessableEntity(
          `Host ${item.host} is included more than once in the authentication config.`,
        )
      }
      hosts.add(item.host)
      const newConfig = new AuthenticationConfig()
      newConfig.host = item.host
      newConfig.authType = item.authType as AuthType
      if (item.headerKey) newConfig.headerKey = item.headerKey
      if (item.jwtUserPath) newConfig.jwtUserPath = item.jwtUserPath
      if (item.cookieName) newConfig.cookieName = item.cookieName
      authConfigEntries.push(newConfig)
    })
  }
  const deleteQb = getQB(ctx, queryRunner).delete().from(AuthenticationConfig)
  const addQb = insertValuesBuilder(
    ctx,
    queryRunner,
    AuthenticationConfig,
    authConfigEntries,
  )
  await deleteQb.execute()
  await addQb.execute()
  if (currAuthConfigEntries) {
    await RedisClient.deleteFromRedis(ctx, [
      ...currAuthConfigEntries,
      AUTH_CONFIG_LIST_KEY,
    ])
  }
}
