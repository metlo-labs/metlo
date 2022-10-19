export const getPathTokens = (path: string): string[] => {
  if (!path) {
    return []
  }
  if (path === "/") {
    return ["/"]
  }
  const tokens = path.split("/")
  if (path[path.length - 1] === "/") {
    tokens.push("/")
  }
  return tokens.filter(token => token.length > 0)
}
