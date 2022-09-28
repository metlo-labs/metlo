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

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date
}
