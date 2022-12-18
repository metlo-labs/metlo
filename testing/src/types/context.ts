export interface Context {
  // host -> name -> value
  cookies: Map<string, Map<string, string>>
}
