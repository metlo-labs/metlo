import { MetloConfigResp, UpdateMetloConfigParams } from "@common/types"
import { RedisClient } from "utils/redis"
import { AppDataSource } from "data-source"
import { MetloConfig } from "models/metlo-config"
import { MetloContext } from "types"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import jsyaml from "js-yaml"
import { decrypt, encrypt, generate_iv } from "utils/encryption"
import { HostMappingCompiled, MetloConfigType } from "./types"
import { validateMetloConfig } from "./validate"
import { populateAuthentication, populateBlockFields } from "./populate-tables"

export const getMetloConfig = async (
  ctx: MetloContext,
): Promise<MetloConfigResp> => {
  const config = (await createQB(ctx)
    .from(MetloConfig, "config")
    .getRawOne()) as MetloConfig
  if (config && config.env) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
    const iv = Buffer.from(config.envIV, "base64")
    const tag = Buffer.from(config.envTag, "base64")
    const decryptedEnv = decrypt(config.env, key, iv, tag)
    config.configString = jsyaml.dump({
      ...(jsyaml.load(config.configString) as object),
      globalTestEnv: JSON.parse(decryptedEnv),
    })
  }
  return config
}

export const getMetloConfigProcessed = async (
  ctx: MetloContext,
): Promise<MetloConfigType> => {
  const config: MetloConfig = await createQB(ctx)
    .from(MetloConfig, "config")
    .getRawOne()
  if (!config) {
    return {}
  }
  return jsyaml.load(config.configString) as MetloConfigType
}

export const getMetloConfigProcessedCached = async (
  ctx: MetloContext,
): Promise<MetloConfigType> => {
  const cacheRes: MetloConfigType | null = await RedisClient.getFromRedis(
    ctx,
    "cachedMetloConfig",
  )
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getMetloConfigProcessed(ctx)
  await RedisClient.addToRedis(ctx, "cachedMetloConfig", realRes, 60)
  return realRes
}

export const getGlobalFullTraceCaptureCached = async (
  ctx: MetloContext,
): Promise<boolean> => {
  const conf = await getMetloConfigProcessedCached(ctx)
  return conf.globalFullTraceCapture ?? false
}

export const getHostMapCached = async (
  ctx: MetloContext,
): Promise<HostMappingCompiled[]> => {
  const conf = await getMetloConfigProcessedCached(ctx)
  return (conf.hostMap || []).map(e => ({
    host: e.host,
    pattern: new RegExp(e.pattern),
  }))
}

export const getMinAnalyzeTracesCached = async (
  ctx: MetloContext,
): Promise<number> => {
  const conf = await getMetloConfigProcessedCached(ctx)
  return conf.minAnalyzeTraces ?? 100
}

export const getCustomWordsCached = async (
  ctx: MetloContext,
): Promise<Set<string>> => {
  const conf = await getMetloConfigProcessedCached(ctx)
  return new Set(conf.customWords || [])
}

export const updateMetloConfig = async (
  ctx: MetloContext,
  updateMetloConfigParams: UpdateMetloConfigParams,
) => {
  await populateMetloConfig(ctx, updateMetloConfigParams.configString)
}

const populateEnvironment = (metloConfig: object) => {
  const parsedConfigString = metloConfig
  if ("globalTestEnv" in parsedConfigString) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
    const iv = generate_iv()
    const { encrypted, tag } = encrypt(
      JSON.stringify(parsedConfigString.globalTestEnv),
      key,
      iv,
    )
    delete parsedConfigString.globalTestEnv
    return {
      configString: jsyaml.dump(parsedConfigString),
      env: encrypted,
      envTag: tag.toString("base64"),
      envIV: iv.toString("base64"),
    }
  }
  return {
    configString: jsyaml.dump(parsedConfigString),
    env: "",
    envTag: "",
    envIV: "",
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
      const {
        configString: configStringNoEnv,
        env,
        envTag,
        envIV,
      } = populateEnvironment(metloConfig)
      await getQB(ctx, queryRunner)
        .update(MetloConfig)
        .set({ configString: configStringNoEnv, env, envTag, envIV })
        .execute()
    } else {
      const newConfig = MetloConfig.create()
      const {
        configString: configStringNoEnv,
        env,
        envTag,
        envIV,
      } = populateEnvironment(metloConfig)
      newConfig.configString = configStringNoEnv
      newConfig.env = env
      newConfig.envIV = envIV
      newConfig.envTag = envTag
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
