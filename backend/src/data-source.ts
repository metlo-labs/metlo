import "dotenv/config";
import { DataSource } from "typeorm";
import { ApiEndpoint, MatchedDataClass, ApiTrace } from "../models";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [ApiEndpoint, MatchedDataClass, ApiTrace],
  migrations: [],
  logging: false,
});
