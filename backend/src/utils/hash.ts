import crypto from "crypto"

export const hasher = key => {
  let salt = process.env.ENCRYPTION_KEY
  let hash = crypto.createHmac("sha512", salt)
  hash.update(key)
  let value = hash.digest("base64")
  return value
}
