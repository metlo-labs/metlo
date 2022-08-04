import "dotenv/config";
import { DataSource } from "typeorm";
import { ApiEndpoint, MatchedDataClass, ApiTrace, OpenApiSpec } from "../models";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [ApiEndpoint, MatchedDataClass, ApiTrace, OpenApiSpec],
  migrations: [],
  logging: false,
});
