import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { AlertType, RiskScore, Status } from "@common/enums"
import { ApiEndpoint } from "models/api-endpoint"

@Entity()
export class Alert extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "enum", enum: AlertType, enumName: "alert_type_enum" })
  type: AlertType

  @Column({
    type: "enum",
    enum: RiskScore,
    default: RiskScore.NONE,
    enumName: "riskscore_enum",
  })
  riskScore: RiskScore

  @Column()
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint, apiEndpoint => apiEndpoint.alerts)
  apiEndpoint: ApiEndpoint

  @Column({ nullable: false })
  description: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column({
    type: "enum",
    enum: Status,
    default: Status.OPEN,
    enumName: "alert_status_enum",
  })
  status: Status

  @Column({ nullable: true })
  resolutionMessage: string

  @Column("jsonb", { nullable: false, default: {} })
  context: object
}
