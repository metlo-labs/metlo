import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AlertType, RiskScore } from "../src/enums";
import { ApiEndpoint } from "./api-endpoint";

@Entity()
export class Alert extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "enum", enum: AlertType})
  type: AlertType

  @Column({ type: "enum", enum: RiskScore, default: RiskScore.NONE })
  riskScore: RiskScore

  @Column()
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint, apiEndpoint => apiEndpoint.alerts)
  apiEndpoint: ApiEndpoint

  @Column()
  description: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column({ type: "boolean", default: false })
  resolved: boolean

  @Column({ nullable: true })
  resolutionMessage: string
}