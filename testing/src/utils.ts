export const processEnvVars = (base: string, envVars: Map<string, string>) => {
  for (let [key, value] of envVars) {
    base = base.replace(`{{${key}}}`, value)
  }
  return base
}
