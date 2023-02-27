import { MetloContext } from "types"
import { UpdateTestingConfigParams } from "@common/api/testing-config"
import { AppDataSource } from "data-source"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import { ApiEndpoint, DataField, TestingConfig } from "models"
import { TestingConfigResp } from "@common/types"
import { parseResourceConfig, ResourceConfigParseRes } from "@metlo/testing"
import { RedisClient } from "utils/redis"
import { DataSection } from "@common/enums"

const DATA_SECTION_TO_PATH: Record<DataSection, string> = {
  [DataSection.REQUEST_PATH]: "req.path",
  [DataSection.REQUEST_QUERY]: "req.query",
  [DataSection.REQUEST_HEADER]: "req.header",
  [DataSection.REQUEST_BODY]: "req.body",
  [DataSection.RESPONSE_HEADER]: "res.header",
  [DataSection.RESPONSE_BODY]: "res.body",
}

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

const getResourcePermissions = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
  dataFields: DataField[],
): Promise<string[]> => {
  const config = await getTestingConfigCached(ctx)
  if (!config?.configString) {
    return []
  }
  const parseRes = parseResourceConfig(config.configString)
  if (!parseRes.res) {
    throw new Error("Bad Testing Config")
  }
  const configObject = parseRes.res
  const resoucePermissions = new Set<string>()
  const endpointEntities: { type: string; path: string }[] = []
  for (const dataField of dataFields) {
    if (dataField.entity) {
      endpointEntities.push({
        type: dataField.entity.split(".")?.[0],
        path: DATA_SECTION_TO_PATH[dataField.dataSection],
      })
    }
  }

  for (const item of configObject) {
    if (item.type == "resource") {
      const permFilters = item.members?.endpoints
      if (permFilters && permFilters.length > 0) {
        for (const permFilter of permFilters) {
          if (permFilter.contains_resource) {
            const containsResource = permFilter.contains_resource
            if (
              endpointEntities.some(
                e =>
                  ((containsResource.type &&
                    e.type === containsResource.type) ||
                    (!containsResource.type && e.type === item.name)) &&
                  e.path.startsWith(containsResource.path),
              )
            ) {
              permFilter.permissions.forEach(perm => {
                resoucePermissions.add(`${item.name}.${perm}`)
              })
            }
          } else {
            if (permFilter.method && permFilter.method !== endpoint.method) {
              continue
            }
            if (permFilter.host && permFilter.host !== endpoint.host) {
              continue
            }
            if (
              permFilter.path &&
              !endpoint.path.match(new RegExp(permFilter.path))
            ) {
              continue
            }
            permFilter.permissions.forEach(perm => {
              resoucePermissions.add(`${item.name}.${perm}`)
            })
          }
        }
      }
    }
  }
  return [...resoucePermissions]
}

export const getResourcePermissionsCached = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
  dataFields: DataField[],
): Promise<string[]> => {
  const key = `endpointResourcePermissionsCached:e#${endpoint.uuid}`
  const cacheRes: string[] | null = await RedisClient.getFromRedis(ctx, key)
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getResourcePermissions(ctx, endpoint, dataFields)
  await RedisClient.addToRedis(ctx, key, realRes, 60)
  return realRes
}
