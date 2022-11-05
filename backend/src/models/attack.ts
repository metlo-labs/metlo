import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { RiskScore, AttackType } from "@common/enums"
import { AttackMeta } from "@common/types"
import { ApiEndpoint } from "models/api-endpoint"
import MetloBaseEntity from "./metlo-base-entity"

@Entity("attack")
export class Attack extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  // Info
  @Column({ type: "enum", enum: RiskScore })
  riskScore: RiskScore

  @Column({ type: "enum", enum: AttackType })
  attackType: AttackType

  @Column({ nullable: false })
  description: string

  @Column({ type: "jsonb", default: {} })
  metadata: AttackMeta

  // Meta
  @Column({ type: "timestamptz" })
  startTime: Date

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date

  @Column({ type: "text", nullable: true })
  uniqueSessionKey: string

  @Column()
  host: string

  @Column({ nullable: true })
  sourceIP: string

  @Column({ nullable: true })
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  @Index()
  apiEndpoint: ApiEndpoint

  // State
  @Column({ type: "bool", default: false })
  resolved: boolean

  @Column({ type: "bool", default: false })
  snoozed: boolean

  @Column({ type: "integer", nullable: true })
  snoozeHours: number
}
