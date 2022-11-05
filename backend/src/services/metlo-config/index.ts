import yaml from "js-yaml"
import { QueryRunner } from "typeorm"
import { AuthType, DisableRestMethod } from "@common/enums"
import { MetloConfigResp, UpdateMetloConfigParams } from "@common/types"
import { BlockFieldsService } from "services/block-fields"
import { AUTH_CONFIG_LIST_KEY, BLOCK_FIELDS_ALL_REGEX } from "~/constants"
import { getPathRegex } from "utils"
import { AuthenticationConfig, BlockFields } from "models"
import { RedisClient } from "utils/redis"
import Error500InternalServer from "errors/error-500-internal-server"
import Error400BadRequest from "errors/error-400-bad-request"
import { AppDataSource } from "data-source"
import { MetloConfig } from "models/metlo-config"
import { MetloContext } from "types"
import { createQB, getQB } from "services/database/utils"

export const getMetloConfig = async (
  ctx: MetloContext,
): Promise<MetloConfigResp> => {
  return await createQB(ctx).from(MetloConfig, "config").getRawOne()
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
              let endpointDisablePaths = allDisablePaths
              if (hostObj[endpoint]["ALL"]) {
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
    await getQB(ctx, queryRunner)
      .insert()
      .into(BlockFields)
      .values(blockFieldsEntries)
      .execute()
  } catch (err) {
    throw new Error500InternalServer(
      `Error in populating metlo config blockFields: ${err}`,
    )
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
    if (authConfigDoc) {
      authConfigDoc.forEach(item => {
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
    const addQb = getQB(ctx, queryRunner)
      .insert()
      .into(AuthenticationConfig)
      .values(authConfigEntries)
    await deleteQb.execute()
    await addQb.execute()
    if (currAuthConfigEntries) {
      await RedisClient.deleteFromRedis(ctx, [
        ...currAuthConfigEntries,
        AUTH_CONFIG_LIST_KEY,
      ])
    }
  } catch (err) {
    throw new Error500InternalServer(
      `Error in populating metlo config authentication: ${err}`,
    )
  }
}

export const populateMetloConfig = async (
  ctx: MetloContext,
  configString: string,
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const metloConfig = yaml.load(configString) as object
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
      await getQB(ctx, queryRunner)
        .insert()
        .into(MetloConfig)
        .values(newConfig)
        .execute()
    }
    await queryRunner.commitTransaction()
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw new Error500InternalServer(err)
  } finally {
    await queryRunner.release()
  }
}
