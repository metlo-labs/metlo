import jsyaml from "js-yaml"
import { getMetloConfig } from "services/metlo-config"
import { MetloContext } from "types"

export async function getGlobalEnvService(ctx: MetloContext) {
  let configRaw = await getMetloConfig(ctx)
  if (configRaw?.configString) {
    const config = jsyaml.load(configRaw.configString) as Object
    if ("globalTestEnv" in config) {
      return config.globalTestEnv
    }
  }
  return []
}
