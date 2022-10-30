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
import { runMigration } from "utils"
import { initMigration1665782029662 } from "migrations/1665782029662-init-migration"
import { addUniqueConstraintApiEndpoint1666678487137 } from "migrations/1666678487137-add-unique-constraint-api-endpoint"
import { dropAnalyzedColumnFromApiTrace1666752646836 } from "migrations/1666752646836-drop-analyzed-column-from-api-trace"
import { addIndexForDataField1666941075032 } from "migrations/1666941075032-add-index-for-data-field"
import { addIsgraphqlColumnApiEndpoint1667095325334 } from "migrations/1667095325334-add-isgraphql-column-api-endpoint"

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
  synchronize: false,
  migrations: [
    initMigration1665782029662,
    addUniqueConstraintApiEndpoint1666678487137,
    dropAnalyzedColumnFromApiTrace1666752646836,
    addIndexForDataField1666941075032,
    addIsgraphqlColumnApiEndpoint1667095325334,
  ],
  migrationsRun: runMigration,
  logging: false,
})
