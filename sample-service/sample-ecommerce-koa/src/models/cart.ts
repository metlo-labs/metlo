import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm"
import { Product } from "./product"

@Entity()
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[]
}
