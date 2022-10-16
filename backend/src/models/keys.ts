import { API_KEY_TYPE } from "@common/enums"
import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from "typeorm"

@Entity()
export class ApiKey extends BaseEntity {
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
