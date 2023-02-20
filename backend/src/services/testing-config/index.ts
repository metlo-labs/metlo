import { MetloContext } from "types"
import { UpdateTestingConfigParams } from "@common/api/testing-config"
import { AppDataSource } from "data-source"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import { TestingConfig } from "models"
import { TestingConfigResp } from "@common/types"
import { parseResourceConfig } from "@metlo/testing"
import { RedisClient } from "utils/redis"

export const getTestingConfig = async (
  ctx: MetloContext,
): Promise<TestingConfigResp> => {
  return (await createQB(ctx)
    .from(TestingConfig, "config")
    .getRawOne()) as TestingConfig
}

export const updateTestingConfig = async (
  ctx: MetloContext,
  params: UpdateTestingConfigParams,
) => {
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
