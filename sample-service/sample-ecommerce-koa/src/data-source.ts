import { DataSource } from "typeorm"
import { Cart, Product, User, Warehouse } from "models"

export const AppDataSource: DataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  entities: [User, Product, Warehouse, Cart],
  synchronize: true,
  logging: false,
})
