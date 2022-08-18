import "dotenv/config";
import { DataSource } from "typeorm";
import {
  ApiEndpoint,
  MatchedDataClass,
  ApiTrace,
  OpenApiSpec,
  Alert,
  Session,
} from "models";

export const AppDataSource: DataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [
    ApiEndpoint,
    MatchedDataClass,
    ApiTrace,
    OpenApiSpec,
    Alert,
    Session,
  ],
  migrations: [],
  logging: false,
});
