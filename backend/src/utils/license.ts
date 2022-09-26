import cache from "memory-cache"

const hasValidLicenseInner = async (): Promise<boolean> => {
  const key = process.env.LICENSE_KEY
  if (!key) {
    console.log(`No LICENSE_KEY env var specified...`)
    return false
  }
  try {
    // @ts-ignore
    const license = await import("@enterprise/license")
    try {
      await license.validateLicense(key)
      return true
    } catch (e) {
      console.log(`Couldn't validate license key: ${e.message}`)
    }
  } catch {
    console.log(
      `Couldn't import enterprise module, contact Metlo for the enterprise package...`,
    )
    return false
  }
}

export const hasValidLicense = async (): Promise<boolean> => {
  const cacheRes: boolean | null = cache.get("hasValidLicense")
  if (cacheRes !== null) {
    return cacheRes
  }
  const valid = await hasValidLicenseInner()
  cache.put("hasValidLicense", valid, 6 * 60 * 60 * 1000)
  return valid
}
