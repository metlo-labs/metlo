import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm"
import { Product } from "./product"

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  role: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  email: string

  @Column()
  hashedPassword: string

  @Column()
  dob: string

  @Column()
  apiKey: string

  @Column({ nullable: true })
  phoneNumber: string

  @Column({ nullable: true })
  address: string

  @OneToMany(() => Product, product => product.owner)
  products: Product[]
}
