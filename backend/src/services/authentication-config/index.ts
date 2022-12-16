import { AuthType } from "@common/enums"
import { QueuedApiTrace, SessionMeta } from "@common/types"
import { AuthenticationConfig } from "models"
import { encryptEcb } from "utils/encryption"
import { AuthenticationConfig as CachedAuthConfig } from "@common/types"
import { AUTH_CONFIG_LIST_KEY } from "~/constants"
import { RedisClient } from "utils/redis"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"

export class AuthenticationConfigService {
  static async setSessionMetadata(ctx: MetloContext, apiTrace: QueuedApiTrace) {
    const redisKey = `auth_config_${apiTrace.host}`
    let cachedAuthConfig: CachedAuthConfig = await RedisClient.getFromRedis(
      ctx,
      redisKey,
    )
    if (!cachedAuthConfig) {
      const authConfigRepo = getRepository(ctx, AuthenticationConfig)
      const authConfig = await authConfigRepo.findOneBy({
        host: apiTrace.host,
      })

      if (authConfig) {
        cachedAuthConfig = {
          host: authConfig.host,
          authType: authConfig.authType,
          headerKey: authConfig.headerKey,
          jwtUserPath: authConfig.jwtUserPath,
          cookieName: authConfig.cookieName,
        }
      } else {
        cachedAuthConfig = {} as CachedAuthConfig
      }
      RedisClient.addToRedis(ctx, redisKey, cachedAuthConfig, 600)
      RedisClient.addValueToSet(ctx, AUTH_CONFIG_LIST_KEY, [
        `auth_config_${apiTrace.host}`,
      ])
    }

    if (Object.keys(cachedAuthConfig).length === 0) {
      return
    }

    const key = process.env.ENCRYPTION_KEY

    const requestHeaders = apiTrace.requestHeaders
    const successfulAuth =
      apiTrace.responseStatus !== 401 && apiTrace.responseStatus !== 403
    let sessionMeta: SessionMeta = {
      authenticationProvided: false,
      authType: cachedAuthConfig.authType,
      authenticationSuccessful: successfulAuth,
    } as SessionMeta
    requestHeaders.forEach(header => {
      switch (cachedAuthConfig.authType) {
        case AuthType.BASIC:
          const authHeaderBasic = header.name.toLowerCase()
          const authHeaderValue = header.value.toLowerCase().includes("basic")
          if (authHeaderBasic === "authorization" && authHeaderValue) {
            const encodedValue = header.value.split("Basic")[1].trim()
            const decodedUser = Buffer.from(encodedValue, "base64")
              ?.toString()
              ?.split(":")[0]
            sessionMeta["authenticationProvided"] = true
            sessionMeta["user"] = decodedUser
            if (key) {
              const encrypted = encryptEcb(encodedValue, key)
              sessionMeta["uniqueSessionKey"] = encrypted
            }
          }
          break
        case AuthType.HEADER:
          const authHeader = cachedAuthConfig.headerKey ?? ""
          if (header.name.toLowerCase() === authHeader.toLowerCase()) {
            const headerValue = header.value
            sessionMeta["authenticationProvided"] = true
            if (key) {
              const encrypted = encryptEcb(headerValue, key)
              sessionMeta["uniqueSessionKey"] = encrypted
            }
          }
          break
        case AuthType.SESSION_COOKIE:
          const cookieName = cachedAuthConfig?.cookieName ?? ""
          if (header.name.toLowerCase() === cookieName.toLowerCase()) {
            const cookieValue = header.value
            sessionMeta["authenticationProvided"] = true
            if (key) {
              const encrypted = encryptEcb(cookieValue, key)
              sessionMeta["uniqueSessionKey"] = encrypted
            }
          }
          break
        case AuthType.JWT:
          const jwtHeader = cachedAuthConfig.headerKey ?? ""
          if (header.name.toLowerCase() === jwtHeader.toLowerCase()) {
            sessionMeta["authenticationProvided"] = true
            const decodedPayload = JSON.parse(
              Buffer.from(
                header.value?.split(".")?.[1] ?? "",
                "base64",
              )?.toString() || "{}",
            )
            if (cachedAuthConfig.jwtUserPath) {
              const jwtUser = cachedAuthConfig.jwtUserPath
                .split(".")
                .reduce((o, k) => {
                  return o && o[k]
                }, decodedPayload)
              if (jwtUser && typeof jwtUser === "string") {
                sessionMeta["user"] = jwtUser
              }
            }
            if (key) {
              const encrypted = encryptEcb(header.value, key)
              sessionMeta["uniqueSessionKey"] = encrypted
            }
          }
          break
        default:
      }
    })
    apiTrace.sessionMeta = sessionMeta
  }
}
