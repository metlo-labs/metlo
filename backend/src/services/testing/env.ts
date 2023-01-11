import jsyaml from "js-yaml"
import { MetloConfig } from "models/metlo-config"
import { getRepository } from "services/database/utils"
import { MetloContext } from "types"

export async function getGlobalEnvService(ctx: MetloContext) {
  const configRaw = await getRepository(ctx, MetloConfig).findOne({
    select: { configString: true },
    where: {},
  })
  const config = jsyaml.load(configRaw.configString) as Object
  if ("metloTestEnv" in config) {
    return config.metloTestEnv
  }
  return []
}
