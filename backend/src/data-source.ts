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
  Webhook,
} from "models"
import { runMigration } from "utils"
import { initMigration1665782029662 } from "migrations/1665782029662-init-migration"
import { addUniqueConstraintApiEndpoint1666678487137 } from "migrations/1666678487137-add-unique-constraint-api-endpoint"
import { dropAnalyzedColumnFromApiTrace1666752646836 } from "migrations/1666752646836-drop-analyzed-column-from-api-trace"
import { addIndexForDataField1666941075032 } from "migrations/1666941075032-add-index-for-data-field"
import { addIsgraphqlColumnApiEndpoint1667095325334 } from "migrations/1667095325334-add-isgraphql-column-api-endpoint"
import { addApiEndpointUuidIndexForAlert1667259254414 } from "migrations/1667259254414-add-apiEndpointUuid-index-for-alert"
import { MetloConfig } from "models/metlo-config"
import { addMetloConfigTable1667599667595 } from "migrations/1667599667595-add-metlo-config-table"
import { updateDisabledPathsColumnBlockFieldsTable1667606447208 } from "migrations/1667606447208-update-disabledPaths-column-blockFields-table"
import { removeApiKeyTypeEnum1669778297643 } from "migrations/1669778297643-remove-apiKeyType-enum"
import { addWebhookTable1670447292139 } from "migrations/1670447292139-add-webhook-table"

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
    MetloConfig,
    Webhook,
  ],
  synchronize: false,
  migrations: [
    initMigration1665782029662,
    addUniqueConstraintApiEndpoint1666678487137,
    dropAnalyzedColumnFromApiTrace1666752646836,
    addIndexForDataField1666941075032,
    addIsgraphqlColumnApiEndpoint1667095325334,
    addApiEndpointUuidIndexForAlert1667259254414,
    addMetloConfigTable1667599667595,
    updateDisabledPathsColumnBlockFieldsTable1667606447208,
    removeApiKeyTypeEnum1669778297643,
    addWebhookTable1670447292139,
  ],
  migrationsRun: runMigration,
  logging: false,
})
