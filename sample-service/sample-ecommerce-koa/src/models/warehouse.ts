import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm"
import { Product } from "./product"

@Entity()
export class Warehouse extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ unique: true })
  name: string

  @Column()
  address: string

  @OneToMany(() => Product, product => product.warehouse)
  products: Product[]
}
