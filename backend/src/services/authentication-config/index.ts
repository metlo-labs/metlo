import { AuthType } from "@common/enums"
import { SessionMeta } from "@common/types"
import { AppDataSource } from "data-source"
import { ApiTrace, AuthenticationConfig } from "models"
import { encryptEcb } from "utils/encryption"

export class AuthenticationConfigService {
  static async setSessionMetadata(apiTrace: ApiTrace) {
    const authConfigRepo = AppDataSource.getRepository(AuthenticationConfig)
    const authConfig = await authConfigRepo.findOneBy({
      host: apiTrace.host,
    })
    if (!authConfig) {
      return
    }
    const key = process.env.ENCRYPTION_KEY

    const requestHeaders = apiTrace.requestHeaders
    const successfulAuth =
      apiTrace.responseStatus !== 401 && apiTrace.responseStatus !== 403
    let sessionMeta: SessionMeta = {
      authenticationProvided: false,
      authType: authConfig.authType,
      authenticationSuccessful: successfulAuth,
    } as SessionMeta
    requestHeaders.forEach(header => {
      switch (authConfig.authType) {
        case AuthType.BASIC:
          const authHeaderBasic = header.name.toLowerCase()
          const authHeaderValue = header.value.toLowerCase().includes("basic")
          if (authHeaderBasic === "authorization" && authHeaderValue) {
            const encodedValue = header.value.split("Basic")[1].trim()
            const decodedUser = Buffer.from(encodedValue, "base64")
              ?.toString()
              ?.split(":")[0]
            const encrypted = encryptEcb(encodedValue, key)
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSessionKey: encrypted,
              user: decodedUser,
            }
          }
          break
        case AuthType.HEADER:
          const authHeader = authConfig.headerKey ?? ""
          if (header.name.toLowerCase() === authHeader.toLowerCase()) {
            const headerValue = header.value
            const encrypted = encryptEcb(headerValue, key)
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSessionKey: encrypted,
            }
          }
          break
        case AuthType.SESSION_COOKIE:
          const cookieName = authConfig?.cookieName ?? ""
          if (header.name.toLowerCase() === cookieName.toLowerCase()) {
            const cookieValue = header.value
            const encrypted = encryptEcb(cookieValue, key)
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSessionKey: encrypted,
            }
          }
          break
        case AuthType.JWT:
          const jwtHeader = authConfig.headerKey ?? ""
          if (header.name.toLowerCase() === jwtHeader.toLowerCase()) {
            const encrypted = encryptEcb(header.value, key)
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSessionKey: encrypted,
            }
            const decodedPayload = JSON.parse(
              Buffer.from(
                header.value?.split(".")?.[1] ?? "",
                "base64",
              )?.toString() || "{}",
            )
            if (authConfig.jwtUserPath) {
              const jwtUser = authConfig.jwtUserPath
                .split(".")
                .reduce((o, k) => {
                  return o && o[k]
                }, decodedPayload)
              if (jwtUser && typeof jwtUser === "string") {
                sessionMeta = {
                  ...sessionMeta,
                  user: jwtUser,
                }
              }
            }
          }
          break
        default:
      }
    })
    apiTrace.sessionMeta = sessionMeta
  }
}
