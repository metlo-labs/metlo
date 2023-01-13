export interface Context {
  // host -> name -> value
  cookies: Record<string, Record<string, string>>
  envVars: Record<string, string | object>
}
