import { API_KEY_TYPE } from "@common/enums"
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class ApiKey extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "text", nullable: false, unique: true })
  name: string

  @Column({ type: "text", nullable: false, unique: true })
  apiKeyHash: string

  @Column({ type: "text", nullable: false })
  keyIdentifier: string

  @Column({
    type: "enum",
    enum: API_KEY_TYPE,
    nullable: false,
    default: API_KEY_TYPE.GENERIC,
    enumName: "api_key_type_enum",
  })
  for: API_KEY_TYPE

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date
}
