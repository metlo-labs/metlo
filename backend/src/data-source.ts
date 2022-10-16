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
import { isDevelopment, runMigration } from "utils"
import { initMigration1665782029662 } from "migrations/1665782029662-init-migration"

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
  migrations: [initMigration1665782029662],
  migrationsRun: !isDevelopment && runMigration,
  logging: false,
})
