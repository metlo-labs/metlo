import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Generated,
} from "typeorm"

@Entity()
export class ApiKey extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "text" })
  name: string

  @Column({ type: "uuid", nullable: false, unique: true })
  @Generated("uuid")
  apiKey: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date
}
