import crypto from "crypto"
import { ApiKey } from "models"
import { hasher } from "utils/hash"

export const createApiKey = (keyName: string): [ApiKey, string] => {
  /**
   * Generate a Generic API Key by default. If needed for AWS/GCP, modify the `for` attribute in the key object
   */
  const buf = Buffer.alloc(30)
  const key = crypto.randomFillSync(buf)
  const b64Key = key.toString("base64")
  const formattedKey = `metlo.${b64Key}`

  const newKey = ApiKey.create({
    name: keyName,
    apiKeyHash: hasher(formattedKey),
    keyIdentifier: b64Key.slice(0, 4),
  })
  return [newKey, formattedKey]
}
