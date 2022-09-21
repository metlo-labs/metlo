import { AuthType } from "@common/enums"
import { SessionMeta } from "@common/types"
import { AppDataSource } from "data-source"
import { ApiTrace, AuthenticationConfig } from "models"
import { encrypt, generate_iv } from "utils/encryption"

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
    const encryptionKey = Buffer.from(key, "base64")
    const keypairIv = generate_iv()

    const requestHeaders = apiTrace.requestHeaders
    const successfulAuth =
      apiTrace.responseStatus !== 401 && apiTrace.responseStatus !== 403
    let sessionMeta: SessionMeta = {
      authenticationProvided: false,
      authType: authConfig.authType,
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
            const { encrypted, tag } = encrypt(
              encodedValue,
              encryptionKey,
              keypairIv,
            )
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSession: {
                key: encrypted,
                iv: keypairIv.toString("base64"),
                tag: tag.toString("base64"),
              },
              user: decodedUser,
            }
          }
          break
        case AuthType.HEADER:
          const authHeader = authConfig.headerKey ?? ""
          if (header.name.toLowerCase() === authHeader.toLowerCase()) {
            const headerValue = header.value
            const { encrypted, tag } = encrypt(
              headerValue,
              encryptionKey,
              keypairIv,
            )
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSession: {
                key: encrypted,
                iv: keypairIv.toString("base64"),
                tag: tag.toString("base64"),
              },
            }
          }
          break
        case AuthType.SESSION_COOKIE:
          const cookieName = authConfig?.cookieName ?? ""
          if (header.name.toLowerCase() === cookieName.toLowerCase()) {
            const cookieValue = header.value
            const { encrypted, tag } = encrypt(
              cookieValue,
              encryptionKey,
              keypairIv,
            )
            sessionMeta = {
              authenticationProvided: true,
              authenticationSuccessful: successfulAuth,
              authType: authConfig.authType,
              uniqueSession: {
                key: encrypted,
                iv: keypairIv.toString("base64"),
                tag: tag.toString("base64"),
              },
            }
          }
          break
        case AuthType.JWT:
          break
        default:
      }
    })
    apiTrace.sessionMeta = sessionMeta
  }
}
