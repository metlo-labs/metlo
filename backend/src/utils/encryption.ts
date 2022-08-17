import crypto from "crypto";

const algorithm = "aes-256-gcm";

/**  encrypts ascii/utf-8 text into a base64-encoded string */
const encrypt = (
  text: string,
  key: Buffer,
  iv: Buffer
): { encrypted: string; tag: Buffer } => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let enc = cipher.update(text, "utf8", "base64");
  enc += cipher.final("base64");
  return { encrypted: enc, tag: cipher.getAuthTag() };
};

/**  decrypt decodes base64-encoded ciphertext into a utf8-encoded string */
const decrypt = (encrypted: string, key: Buffer, iv: Buffer, authTag) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let str = decipher.update(encrypted, "base64", "utf8");
  str += decipher.final("utf8");
  return str;
};

/**
 * Returns a 12 byte/96 bits pseudo-random value required by gcm
 */
const generate_iv = () => {
  return crypto.randomBytes(12);
};

export { encrypt, decrypt, generate_iv };
