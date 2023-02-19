import jsonMap from "json-source-map"
import { MetloContext } from "types"
import { UpdateTestingConfigParams } from "@common/api/testing-config"
import Error400BadRequest from "errors/error-400-bad-request"
import { validateSchema } from "./constants"
import { AppDataSource } from "data-source"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import { TestingConfig } from "models"
import { TestingConfigResp } from "@common/types"
import { RedisClient } from "utils/redis"

const isValidTestingConfig = (configString: string) => {
  configString = configString.trim()
  let testingConfig = null
  try {
    testingConfig = jsonMap.parse(configString) ?? {}
  } catch (err) {
    throw new Error400BadRequest("Config is not a valid json file")
  }

  const valid = validateSchema(testingConfig.data)
  if (!valid) {
    const errors = validateSchema.errors
    if (errors) {
      const error = errors[0]
      let instancePath = error.instancePath
      let errorMessage = `${error.instancePath} ${error.message}`
      switch (error.keyword) {
        case "additionalProperties":
          const additionalProperty = error.params.additionalProperty
          instancePath += `/${additionalProperty}`
          errorMessage = `property '${additionalProperty}' is not expected to be here`
          break
        case "enum":
          errorMessage = `must be equal to one of the allowed values: ${error.params.allowedValues?.join(
            ", ",
          )}`
          break
      }
      const lineNumber =
        testingConfig.pointers?.[instancePath]?.key?.line ?? null
      throw new Error400BadRequest(
        `${errorMessage}${lineNumber ? ` on line ${lineNumber + 1}` : ""}`,
      )
    }
  }
  return true
}

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
  isValidTestingConfig(params.configString)
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
}

const getEntityTags = async (ctx: MetloContext): Promise<string[]> => {
  const config = (await createQB(ctx)
    .from(TestingConfig, "config")
    .getRawOne()) as TestingConfig
  if (!config) {
    return []
  }
  const configObject = JSON.parse(config.configString)
  const entities = configObject.entities as Record<
    string,
    Record<string, string>[]
  >
  const entityTags = new Set<string>()
  for (const entityName in entities) {
    const entity = entities[entityName]
    for (const example of entity) {
      for (const field in example) {
        entityTags.add(`${entityName}.${field}`)
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
