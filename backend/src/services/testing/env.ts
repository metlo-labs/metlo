import { AppDataSource } from "data-source"
import jsyaml from "js-yaml"
import { MetloConfig } from "models/metlo-config"
import { getEntityManager } from "services/database/utils"
import { MetloContext } from "types"

export async function getGlobalEnvService(ctx: MetloContext) {
  const qr = await AppDataSource.createQueryRunner()
  const configRaw = await getEntityManager(ctx, qr).findOne(MetloConfig, {
    select: { configString: true },
    where: {},
  })
  const config = jsyaml.load(configRaw.configString) as Object
  if ("metloTestEnv" in config) {
    return config.metloTestEnv
  }
  return []
}
