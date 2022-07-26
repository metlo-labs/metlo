import "dotenv/config"
import { DataSource } from "typeorm";
import { ApiTrace, MatchedDataClass } from "../models"

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [ApiTrace, MatchedDataClass],
  migrations: [],
  logging: false,
})
