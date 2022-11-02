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
]

export const isSensitiveDataKey = (key: string) => {
  const keyLowerCase = key?.toLowerCase() ?? null
  return key && scrubKeys.includes(keyLowerCase)
}
