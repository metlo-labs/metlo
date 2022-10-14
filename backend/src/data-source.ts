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
  synchronize: true,
  logging: false,
})
