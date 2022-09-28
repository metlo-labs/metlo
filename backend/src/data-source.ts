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
  AggregateTraceDataMinutely,
  AuthenticationConfig,
  AggregateTraceDataHourly,
  Attack,
} from "models"

export const AppDataSource: DataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
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
    AggregateTraceDataMinutely,
    AuthenticationConfig,
    AggregateTraceDataHourly,
    Attack,
  ],
  migrations: [],
  logging: false,
})
