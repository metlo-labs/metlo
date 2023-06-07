import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { User } from "./user"
import { Warehouse } from "./warehouse"

@Entity()
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  name: string

  @Column()
  description: string

  @Column({ type: "real" })
  price: number

  @ManyToOne(() => Warehouse, warehouse => warehouse.products)
  warehouse: Warehouse

  @ManyToOne(() => User, user => user.products)
  owner: User
}
