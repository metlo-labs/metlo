import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm"
import { AlertType } from "@common/enums"
import { WebhookRun } from "@common/types"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class Webhook extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @Column({ nullable: false })
  url: string

  @Column({ type: "integer", nullable: false, default: 3 })
  maxRetries: number

  @Column({ type: "varchar", array: true, default: [] })
  alertTypes: AlertType[]

  @Column({ type: "jsonb", nullable: false, default: [] })
  runs: WebhookRun[]
}
