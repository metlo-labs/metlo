import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { DataField } from "models/data-field"
import { Alert } from "models/alert"
import { OpenApiSpec } from "models/openapi-spec"
import { RestMethod, RiskScore } from "@common/enums"
import { getPathTokens, isParameter } from "utils"

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

  @Column({ type: "integer", nullable: false, default: 0 })
  numberParams: number

  @Column({ type: "integer", default: 0 })
  totalCalls: number

  @Column({ type: "enum", enum: RestMethod })
  method: RestMethod

  @Column({ type: "enum", enum: RiskScore, default: RiskScore.NONE })
  riskScore: RiskScore

  @Column({ nullable: true })
  owner: string

  @OneToMany(() => DataField, dataField => dataField.apiEndpoint)
  dataFields: DataField[]

  @OneToMany(() => Alert, alert => alert.apiEndpoint)
  alerts: Alert[]

  @Column({ nullable: true })
  openapiSpecName: string

  @ManyToOne(() => OpenApiSpec)
  @JoinColumn()
  openapiSpec: OpenApiSpec

  @BeforeInsert()
  addNumberParams() {
    if (this.path) {
      const pathTokens = getPathTokens(this.path)
      let numParams = 0
      for (let i = 0; i < pathTokens.length; i++) {
        const token = pathTokens[i]
        if (isParameter(token)) {
          numParams += 1
        }
      }
      this.numberParams = numParams
    }
  }
}
