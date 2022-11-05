import yaml from "js-yaml"
import fs from "fs"
import { AppDataSource } from "data-source"
import { AuthenticationConfig } from "models"
import { AuthType } from "@common/enums"
import { RedisClient } from "utils/redis"
import { AUTH_CONFIG_LIST_KEY } from "~/constants"
import { MetloContext } from "types"
import { getQB } from "services/database/utils"

export const populateAuthentication = async (ctx: MetloContext) => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.error(`No ENCRYPTION_KEY found. Cannot set authentication config.`)
    return
  }
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const metloConfig: object = yaml.load(
      fs.readFileSync("./metlo-config.yaml", "utf-8"),
    ) as object
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
    await queryRunner.commitTransaction()
    if (currAuthConfigEntries) {
      await RedisClient.deleteFromRedis(ctx, [
        ...currAuthConfigEntries,
        AUTH_CONFIG_LIST_KEY,
      ])
    }
  } catch (err) {
    console.error(`Error in populating metlo config authentication: ${err}`)
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner?.release()
  }
}
