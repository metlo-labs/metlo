import "dotenv/config"
import { DataSource } from "typeorm"
import {
  ApiEndpoint,
  DataField,
  ApiTrace,
  OpenApiSpec,
  Alert,
  Session,
  Connections,
  ApiEndpointTest,
  ApiKey,
  BlockFields,
  InstanceSettings,
  AuthenticationConfig,
  AggregateTraceDataHourly,
  Attack,
} from "models"
import { removeOwnerColumnFromApitrace1665697571667 } from "migrations/1665697571667-remove-owner-column-from-apitrace"
import { isDevelopment } from "utils"

export const AppDataSource: DataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  entities: [
    ApiEndpoint,
    DataField,
    ApiTrace,
    OpenApiSpec,
    Alert,
    Session,
    Connections,
    ApiEndpointTest,
    ApiKey,
    BlockFields,
    InstanceSettings,
    AuthenticationConfig,
    AggregateTraceDataHourly,
    Attack,
  ],
  synchronize: isDevelopment,
  migrations: [removeOwnerColumnFromApitrace1665697571667],
  migrationsRun: !isDevelopment,
  logging: false,
})
