export const getPathTokens = (path: string): string[] => {
  if (!path) {
    return []
  }
  if (path === "/") {
    return ["/"]
  }
  const tokens = path.split("/")
  return tokens.filter(token => token.length > 0)
}
