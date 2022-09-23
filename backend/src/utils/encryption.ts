import crypto from "crypto"

const algorithm = "aes-256-gcm"
const ecbAlgorithm = "des-ecb"

/**  encrypts ascii/utf-8 text into a base64-encoded string */
const encrypt = (
  text: string,
  key: Buffer,
  iv: Buffer,
): { encrypted: string; tag: Buffer } => {
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let enc = cipher.update(text, "utf8", "base64")
  enc += cipher.final("base64")
  return { encrypted: enc, tag: cipher.getAuthTag() }
}

export const encryptEcb = (text: string, key: string): string => {
  const keyBuffer = Buffer.from(key, "base64").subarray(0, 8)
  const cipher = crypto.createCipheriv(ecbAlgorithm, keyBuffer, null)
  let enc = cipher.update(text, "utf8", "base64")
  enc += cipher.final("base64")
  return enc
}

/**  decrypt decodes base64-encoded ciphertext into a utf8-encoded string */
const decrypt = (
  encrypted: string,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer,
) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  let str = decipher.update(encrypted, "base64", "utf8")
  str += decipher.final("utf8")
  return str
}

/**
 * Returns a 12 byte/96 bits pseudo-random value required by gcm
 */
const generate_iv = () => {
  return crypto.randomBytes(12)
}

export { encrypt, decrypt, generate_iv }
