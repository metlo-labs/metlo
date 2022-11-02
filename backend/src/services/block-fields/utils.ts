const scrubKeys = [
  "authorization",
  "api_key",
  "apikey",
  "password",
  "secret",
  "passwd",
  "access_token",
  "x-api-key",
  "x_api_key",
  "api-key",
  "blech",
]
const simpleCreditCardRegex = new RegExp(String.raw`^(?:\d[ -]*?){13,16}$`)

export const isSensitiveDataKey = (key: string) => {
  const keyLowerCase = key?.toLowerCase() ?? null
  return key && scrubKeys.includes(keyLowerCase)
}

export const isSensitiveDataValue = (value: any) => {
  if (typeof value !== "string") {
    return false
  }
  try {
    return value && simpleCreditCardRegex.test(value)
  } catch (err) {
    return false
  }
}
