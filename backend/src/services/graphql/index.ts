export const getGraphQlPaths = () => {
  return ["/graphql"]
}

export const isGraphQlEndpoint = (path: string) => {
  if (getGraphQlPaths().includes(path)) {
    return true
  }
}
