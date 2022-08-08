import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MatchedDataClass } from "./matched-data-class";
import { RestMethod, RiskScore } from "../src/enums";
import { OpenApiSpec } from "./openapi-spec";
import { Alert } from "./alert";

@Entity()
export class ApiEndpoint extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: false })
  path: string

  @Column({ nullable: false })
  pathRegex: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column({ nullable: false })
  host: string

  @Column({ type: "integer", default: 0})
  totalCalls: number

  @Column({ type: "enum", enum: RestMethod})
  method: RestMethod

  @Column({ type: "enum", enum: RiskScore, default: RiskScore.NONE })
  riskScore: RiskScore

  @Column({ nullable: true })
  owner: string

  @OneToMany(() => MatchedDataClass, dataClass => dataClass.apiEndpoint, { cascade: true })
  sensitiveDataClasses: MatchedDataClass[]

  @OneToMany(() => Alert, alert => alert.apiEndpoint, { cascade: true })
  alerts: Alert[]

  @Column({ nullable: true })
  openapiSpecName: string

  @ManyToOne(() => OpenApiSpec)
  @JoinColumn()
  openapiSpec: OpenApiSpec

  addDataClass(dataClass: MatchedDataClass) {
    if (this.sensitiveDataClasses == null) {
      this.sensitiveDataClasses = Array<MatchedDataClass>();
    }
    this.sensitiveDataClasses.push(dataClass);
  }

  addAlert(alert: Alert) {
    if (this.alerts == null) {
      this.alerts = Array<Alert>();
    }
    this.alerts.push(alert);
  }
}
