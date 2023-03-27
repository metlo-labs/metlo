import yaml from "js-yaml"
import Ajv from "ajv"
import formatsPlugin from "ajv-formats"
import SourceMap from "js-yaml-source-map"
import Error400BadRequest from "errors/error-400-bad-request"
import { METLO_CONFIG_SCHEMA } from "./constants"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"
import Error500InternalServer from "errors/error-500-internal-server"
import mlog from "logger"
import { MetloContext } from "types"
import { getValidPath } from "utils"
import { RedisClient } from "utils/redis"
import { AUTH_CONFIG_LIST_KEY, BLOCK_FIELDS_LIST_KEY } from "~/constants"

export const validateMetloConfig = (configString: string) => {
  configString = configString.trim()
  let metloConfig: object = null
  const map = new SourceMap()
  try {
    metloConfig = yaml.load(configString, { listener: map.listen() }) as object
    metloConfig = metloConfig ?? {}
  } catch (err) {
    throw new Error400BadRequest("Config is not a valid yaml file")
  }
  const ajv = new Ajv()
  formatsPlugin(ajv)

  const validate = ajv.compile(METLO_CONFIG_SCHEMA)
  const valid = validate(metloConfig)
  if (!valid) {
    const errors = validate.errors
    if (errors) {
      const error = errors[0]
      let instancePath = error.instancePath
        .replace(/\//g, ".")
        .replace(/~1/g, "/")
        .slice(1)
      let errorMessage = `${error.instancePath} ${error.message}`
      switch (error.keyword) {
        case "additionalProperties":
          const additionalProperty = error.params.additionalProperty
          instancePath += `.${additionalProperty}`
          errorMessage = `property '${additionalProperty}' is not expected to be here`
          break
        case "enum":
          errorMessage = `must be equal to one of the allowed values: ${error.params.allowedValues?.join(
            ", ",
          )}`
          break
      }
      const lineNumber = map.lookup(instancePath)?.line
      throw new Error400BadRequest(
        `${errorMessage}${lineNumber ? ` on line ${lineNumber}` : ""}`,
      )
    }
  }
  return metloConfig
}

export const validateBlockFields = async (
  ctx: MetloContext,
  metloConfig: object,
) => {
  const blockFieldsDoc = metloConfig?.["blockFields"]
  if (blockFieldsDoc) {
    for (const host in blockFieldsDoc) {
      const hostObj = blockFieldsDoc[host]
      if (hostObj) {
        for (const endpoint in hostObj) {
          if (endpoint && endpoint !== "ALL") {
            const validPath = getValidPath(endpoint)
            if (!validPath.isValid) {
              throw new Error400BadRequest(`${endpoint}: ${validPath.errMsg}`)
            }
          }
        }
      }
    }
  }
  const currBlockFieldsEntries = await RedisClient.getValuesFromSet(
    ctx,
    BLOCK_FIELDS_LIST_KEY,
  )
  if (currBlockFieldsEntries) {
    await RedisClient.deleteFromRedis(ctx, [
      ...currBlockFieldsEntries,
      BLOCK_FIELDS_LIST_KEY,
    ])
  }
}

export const validateAuthentication = async (
  ctx: MetloContext,
  metloConfig: object,
) => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    mlog.error(`No ENCRYPTION_KEY found. Cannot set authentication config.`)
    throw new Error500InternalServer(
      "No ENCRYPTION_KEY found. Cannot set authentication config.",
    )
  }
  const authConfigDoc = metloConfig?.["authentication"]
  if (authConfigDoc) {
    const hosts = new Set<string>()
    authConfigDoc.forEach(item => {
      if (hosts.has(item.host)) {
        throw new Error422UnprocessableEntity(
          `Host ${item.host} is included more than once in the authentication config.`,
        )
      }
      hosts.add(item.host)
    })
  }
  const currAuthConfigEntries = await RedisClient.getValuesFromSet(
    ctx,
    AUTH_CONFIG_LIST_KEY,
  )
  if (currAuthConfigEntries) {
    await RedisClient.deleteFromRedis(ctx, [
      ...currAuthConfigEntries,
      AUTH_CONFIG_LIST_KEY,
    ])
  }
}
