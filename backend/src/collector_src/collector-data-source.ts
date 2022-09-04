import "dotenv/config"
import { DataSource } from "typeorm"
import { ApiKey, ApiTrace } from "models"

export const CollectorDataSource: DataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [ApiKey, ApiTrace],
  migrations: [],
  logging: false,
})
