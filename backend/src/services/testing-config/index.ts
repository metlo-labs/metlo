import { MetloContext } from "types"
import { UpdateTestingConfigParams } from "@common/api/testing-config"
import { AppDataSource } from "data-source"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import { ApiEndpoint, TestingConfig } from "models"
import { TestingConfigResp } from "@common/types"
import {
  parseResourceConfig,
  ResourceConfigParseRes,
  findEndpointResourcePermissions,
  processResourceConfig,
  TemplateConfig,
} from "@metlo/testing"
import { RedisClient } from "utils/redis"
import { populateEndpointPerms } from "./populate-endpoint-perms"

export const getTestingConfig = async (
  ctx: MetloContext,
): Promise<TestingConfigResp> => {
  return (await createQB(ctx)
    .from(TestingConfig, "config")
    .getRawOne()) as TestingConfig
}

export const getTestingConfigCached = async (
  ctx: MetloContext,
): Promise<TestingConfigResp> => {
  const cacheRes: TestingConfigResp | null = await RedisClient.getFromRedis(
    ctx,
    "testingConfigCached",
  )
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getTestingConfig(ctx)
  await RedisClient.addToRedis(ctx, "testingConfigCached", realRes, 60)
  return realRes
}

export const getTemplateConfig = async (
  ctx: MetloContext,
): Promise<TemplateConfig | null> => {
  const conf = await getTestingConfig(ctx)
  if (!conf || !conf.configString) {
    return null
  }
  const parseRes = parseResourceConfig(conf.configString)
  if (!parseRes.res) {
    return null
  }
  return processResourceConfig(parseRes.res)
}

export const updateTestingConfig = async (
  ctx: MetloContext,
  params: UpdateTestingConfigParams,
): Promise<ResourceConfigParseRes> => {
  const confString = params.configString
  const parseRes = parseResourceConfig(confString)
  if (!parseRes.res) {
    return parseRes
  }
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const existingTestingConfig = await getQB(ctx, queryRunner)
      .select(["uuid"])
      .from(TestingConfig, "config")
      .getRawOne()
    if (existingTestingConfig) {
      await getQB(ctx, queryRunner)
        .update(TestingConfig)
        .set({ configString: params.configString })
        .execute()
    } else {
      const newConfig = TestingConfig.create()
      newConfig.configString = params.configString
      await insertValueBuilder(
        ctx,
        queryRunner,
        TestingConfig,
        newConfig,
      ).execute()
    }
    await populateEndpointPerms(
      ctx,
      queryRunner,
      processResourceConfig(parseRes.res),
    )
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw err
  } finally {
    await queryRunner.release()
  }
  return parseRes
}

const getEntityTags = async (ctx: MetloContext): Promise<string[]> => {
  const config = (await createQB(ctx)
    .from(TestingConfig, "config")
    .getRawOne()) as TestingConfig
  if (!config) {
    return []
  }
  const parseRes = parseResourceConfig(config.configString)
  if (!parseRes.res) {
    throw new Error("Bad Testing Config")
  }
  const configObject = parseRes.res
  let entityTags = new Set<string>()
  for (const e of configObject) {
    if (e.type == "actor" || e.type == "resource") {
      if (e.members.items && e.members.items.length > 0) {
        const actorEnts = Object.keys(e.members.items[0]).map(
          k => `${e.name}.${k}`,
        )
        entityTags = new Set<string>([...entityTags, ...actorEnts])
      }
    }
  }
  return [...entityTags]
}

export const getEntityTagsCached = async (
  ctx: MetloContext,
): Promise<string[]> => {
  const cacheRes: string[] | null = await RedisClient.getFromRedis(
    ctx,
    "entityTagsCached",
  )
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getEntityTags(ctx)
  await RedisClient.addToRedis(ctx, "entityTagsCached", realRes, 60)
  return realRes
}

const getAllResourcePermissions = async (
  ctx: MetloContext,
): Promise<string[]> => {
  const config = await getTestingConfigCached(ctx)
  if (!config?.configString) {
    return []
  }
  const parseRes = parseResourceConfig(config.configString)
  if (!parseRes.res) {
    return []
  }
  const parsedConfig = processResourceConfig(parseRes.res)
  return Object.entries(parsedConfig.resources)
    .map(([name, resource]) => resource.permissions.map(e => `${name}.${e}`))
    .flat()
}

export const getAllResourcePermissionsCached = async (
  ctx: MetloContext,
): Promise<string[]> => {
  const cacheRes: string[] | null = await RedisClient.getFromRedis(
    ctx,
    "allResourcePermissionsCached",
  )
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getAllResourcePermissions(ctx)
  await RedisClient.addToRedis(ctx, "allResourcePermissionsCached", realRes, 60)
  return realRes
}

const getResourcePermissions = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
): Promise<string[]> => {
  const config = await getTestingConfigCached(ctx)
  if (!config?.configString) {
    return []
  }
  const parseRes = parseResourceConfig(config.configString)
  if (!parseRes.res) {
    return []
  }
  const parsedConfig = processResourceConfig(parseRes.res)
  try {
    return findEndpointResourcePermissions(endpoint, parsedConfig)
  } catch {
    return []
  }
}

export const getResourcePermissionsCached = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
): Promise<string[]> => {
  const key = `endpointResourcePermissionsCached:e#${endpoint.uuid}`
  const cacheRes: string[] | null = await RedisClient.getFromRedis(ctx, key)
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getResourcePermissions(ctx, endpoint)
  await RedisClient.addToRedis(ctx, key, realRes, 60)
  return realRes
}
