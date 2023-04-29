export enum EndpointTab {
  OVERVIEW = "overview",
  FIELDS = "fields",
  TRACES = "traces",
  ALERTS = "alerts",
  TESTS = "tests",
}

export enum ConnectionTab {
  AWS = "aws",
  GCP = "gcp",
  PYTHON = "python",
  NODEJS = "nodejs",
  JAVA = "java",
  GO = "go",
  KUBERNETES = "kubernetes",
  DOCKER_COMPOSE = "dockercompose",
  BURP_SUITE = "burpsuite",
}

export enum SettingsTab {
  KEYS = "keys",
  CONFIG = "config",
  TESTING_CONFIG = "testing-config",
  API_SPECS = "api-specs",
  CONNECTIONS = "connections",
}

export enum HostsTab {
  LIST = "list",
  GRAPH = "graph",
}
