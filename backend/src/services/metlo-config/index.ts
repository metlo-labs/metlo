import yaml from "js-yaml"
import { QueryRunner } from "typeorm"
import { AuthType, DisableRestMethod } from "@common/enums"
import { MetloConfigResp, UpdateMetloConfigParams } from "@common/types"
import { BlockFieldsService } from "services/block-fields"
import {
  AUTH_CONFIG_LIST_KEY,
  BLOCK_FIELDS_ALL_REGEX,
  BLOCK_FIELDS_LIST_KEY,
} from "~/constants"
import { getPathRegex } from "utils"
import { AuthenticationConfig, BlockFields } from "models"
import { RedisClient } from "utils/redis"
import Error500InternalServer from "errors/error-500-internal-server"
import Error400BadRequest from "errors/error-400-bad-request"
import { AppDataSource } from "data-source"
import { MetloConfig } from "models/metlo-config"
import { MetloContext } from "types"
import {
  createQB,
  getQB,
  insertValueBuilder,
  insertValuesBuilder,
} from "services/database/utils"

const validConfigKeys = ["blockFields", "authentication"]
const authenticationItemKeys = [
  "host",
  "authType",
  "headerKey",
  "jwtUserPath",
  "cookieName",
]

export const getMetloConfig = async (
  ctx: MetloContext,
): Promise<MetloConfigResp> => {
  return await createQB(ctx).from(MetloConfig, "config").getRawOne()
}

export const validateMetloConfig = (configString: string) => {
  const metloConfig = yaml.load(configString) as object
  const rootKeys = Object.keys(metloConfig)
  if (rootKeys.length > 2) {
    throw new Error400BadRequest(
      "Too many root level keys, should only be one instance of 'authentication' and 'blockFields'",
    )
  }
  for (const key of rootKeys) {
    if (!validConfigKeys.includes(key)) {
      throw new Error400BadRequest(
        "Config root key is not one of 'authentication' or 'blockFields'",
      )
    }
  }
  return metloConfig
}

export const updateMetloConfig = async (
  ctx: MetloContext,
  updateMetloConfigParams: UpdateMetloConfigParams,
) => {
  if (!updateMetloConfigParams.configString) {
    throw new Error400BadRequest("Please provide configuration specifications.")
  }
  await populateMetloConfig(ctx, updateMetloConfigParams.configString)
}

const addToBlockFields = (
  blockFieldsEntries: BlockFields[],
  host: string,
  method: DisableRestMethod,
  path: string,
  pathRegex: string,
  disabledPaths: string[],
) => {
  const disabledPathsObj = {
    reqQuery: [],
    reqHeaders: [],
    reqBody: [],
    resHeaders: [],
    resBody: [],
  }
  disabledPaths.forEach(path => {
    if (path.includes("req.query")) disabledPathsObj.reqQuery.push(path)
    else if (path.includes("req.headers"))
      disabledPathsObj.reqHeaders.push(path)
    else if (path.includes("req.body")) disabledPathsObj.reqBody.push(path)
    else if (path.includes("res.headers"))
      disabledPathsObj.resHeaders.push(path)
    else if (path.includes("res.body")) disabledPathsObj.resBody.push(path)
  })
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

const populateBlockFields = async (
  ctx: MetloContext,
  metloConfig: object,
  queryRunner: QueryRunner,
) => {
  try {
    const blockFieldsDoc = metloConfig?.["blockFields"]
    const blockFieldsEntries: BlockFields[] = []
    const currBlockFieldsEntries = await RedisClient.getValuesFromSet(
      ctx,
      BLOCK_FIELDS_LIST_KEY,
    )
    if (typeof blockFieldsDoc !== "object") {
      throw new Error400BadRequest(
        "The value for the 'blockFields' config must be an object",
      )
    }
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
            if (endpoint === "disable_paths") {
              throw new Error400BadRequest(
                "'disable_paths' field must be under an 'ALL' field or a method field such as 'GET'",
              )
            }
            if (endpoint && endpoint !== "ALL") {
              let endpointDisablePaths = allDisablePaths
              if (hostObj[endpoint]["ALL"]) {
                if (!hostObj[endpoint]?.["ALL"]?.["disable_paths"]) {
                  throw new Error400BadRequest(
                    "Must include a 'disable_paths' field under an 'ALL' field in 'blockFields' config",
                  )
                }
                if (
                  !Array.isArray(hostObj[endpoint]?.["ALL"]?.["disable_paths"])
                ) {
                  throw new Error400BadRequest(
                    "'disable_paths' must be a list of paths to disable in 'blockFields' config",
                  )
                }
                endpointDisablePaths = endpointDisablePaths?.concat(
                  hostObj[endpoint]["ALL"]["disable_paths"] ?? [],
                )
                const pathRegex = getPathRegex(endpoint)
                addToBlockFields(
                  blockFieldsEntries,
                  host,
                  DisableRestMethod.ALL,
                  endpoint,
                  pathRegex,
                  endpointDisablePaths,
                )
              }
              for (const method in hostObj[endpoint]) {
                if (method && method !== "ALL") {
                  if (!DisableRestMethod[method]) {
                    throw new Error400BadRequest(
                      `Field ${method} is not a valid key for 'blockFields' config, must be one of ${Object.keys(
                        DisableRestMethod,
                      ).join(", ")}`,
                    )
                  }
                  if (!hostObj?.[endpoint]?.[method]?.["disable_paths"]) {
                    throw new Error400BadRequest(
                      `Must include a 'disable_paths' field under a '${method}' field in 'blockFields' config`,
                    )
                  }
                  if (
                    !Array.isArray(
                      hostObj[endpoint]?.[method]?.["disable_paths"],
                    )
                  ) {
                    throw new Error400BadRequest(
                      "'disable_paths' must be a list of paths to disable in 'blockFields' config",
                    )
                  }
                  const blockFieldMethod = DisableRestMethod[method]
                  const pathRegex = getPathRegex(endpoint)
                  const disabledPaths = endpointDisablePaths?.concat(
                    hostObj[endpoint][method]?.["disable_paths"] ?? [],
                  )
                  addToBlockFields(
                    blockFieldsEntries,
                    host,
                    blockFieldMethod,
                    endpoint,
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
  } catch (err) {
    throw err
  }
}

const populateAuthentication = async (
  ctx: MetloContext,
  metloConfig: object,
  queryRunner: QueryRunner,
) => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.error(`No ENCRYPTION_KEY found. Cannot set authentication config.`)
    throw new Error500InternalServer(
      "No ENCRYPTION_KEY found. Cannot set authentication config.",
    )
  }
  try {
    const authConfigDoc = metloConfig?.["authentication"]
    const authConfigEntries: AuthenticationConfig[] = []
    const currAuthConfigEntries = await RedisClient.getValuesFromSet(
      ctx,
      AUTH_CONFIG_LIST_KEY,
    )
    if (!Array.isArray(authConfigDoc)) {
      throw new Error400BadRequest(
        "The value for the 'authentication' config must be an array of objects",
      )
    }
    if (authConfigDoc) {
      authConfigDoc.forEach(item => {
        if (typeof item !== "object") {
          throw new Error400BadRequest(
            "Each entry for 'authentication' config must be an object with required properties 'host' and 'authType', and optional properties 'headerKey', 'jwtUserPath', and 'cookieName'",
          )
        }
        for (const key in item) {
          if (!authenticationItemKeys.includes(key)) {
            throw new Error400BadRequest(
              `Field ${key} is not a valid field for an 'authentication' config entry, can only be the following: 'host', 'authType', 'headerKey', 'jwtUserPath', 'cookieName'`,
            )
          }
        }
        if (!item.host || !item.authType) {
          throw new Error400BadRequest(
            "Fields 'host' and 'authType' must be included in every entry of the 'authentication' config",
          )
        }
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
  } catch (err) {
    throw err
  }
}

export const populateMetloConfig = async (
  ctx: MetloContext,
  configString: string,
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const metloConfig = validateMetloConfig(configString)
    await queryRunner.startTransaction()
    await populateAuthentication(ctx, metloConfig, queryRunner)
    await populateBlockFields(ctx, metloConfig, queryRunner)
    const metloConfigEntry = await getQB(ctx, queryRunner)
      .select(["uuid"])
      .from(MetloConfig, "config")
      .getRawOne()
    if (metloConfigEntry) {
      await getQB(ctx, queryRunner)
        .update(MetloConfig)
        .set({ configString })
        .execute()
    } else {
      const newConfig = MetloConfig.create()
      newConfig.configString = configString
      await insertValueBuilder(
        ctx,
        queryRunner,
        MetloConfig,
        newConfig,
      ).execute()
    }
    await queryRunner.commitTransaction()
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw err
  } finally {
    await queryRunner.release()
  }
}
