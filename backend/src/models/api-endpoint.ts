import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"
import { DataField } from "models/data-field"
import { Alert } from "models/alert"
import { OpenApiSpec } from "models/openapi-spec"
import { RestMethod, RiskScore } from "@common/enums"
import { isParameter } from "utils"
import { getPathTokens } from "@common/utils"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
@Unique("unique_constraint_api_endpoint", ["path", "method", "host"])
export class ApiEndpoint extends MetloBaseEntity {
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

  @Column({ type: "timestamptz", nullable: true })
  firstDetected: Date

  @Column({ type: "timestamptz", nullable: true })
  lastActive: Date

  @Column({ nullable: false })
  host: string

  @Column({ type: "integer", nullable: false, default: 0 })
  numberParams: number

  @Column({ type: "enum", enum: RestMethod, enumName: "rest_method_enum" })
  method: RestMethod

  @Column({
    type: "enum",
    enum: RiskScore,
    default: RiskScore.NONE,
    enumName: "riskscore_enum",
  })
  riskScore: RiskScore

  @Column({ nullable: true })
  owner: string

  @Column({ type: "uuid", array: true, default: [] })
  oldEndpointUuids: string[]

  @Column({ type: "varchar", array: true, default: [] })
  resourcePermissions: string[]

  @OneToMany(() => DataField, dataField => dataField.apiEndpoint)
  dataFields: DataField[]

  @OneToMany(() => Alert, alert => alert.apiEndpoint)
  alerts: Alert[]

  @Column({ type: "bool", default: true })
  isAuthenticatedDetected: boolean

  @Column({ type: "bool", nullable: true })
  isAuthenticatedUserSet: boolean

  @Column({ type: "bool", default: false })
  isGraphQl: boolean

  @Column({ type: "jsonb", nullable: false, default: {} })
  hostIps: { [key: string]: number }

  @Column({ type: "jsonb", nullable: false, default: {} })
  srcIps: { [key: string]: number }

  @Column({ type: "bool", nullable: false, default: false })
  userSet: boolean

  @Column({ nullable: true })
  openapiSpecName: string

  @ManyToOne(() => OpenApiSpec)
  @JoinColumn()
  openapiSpec: OpenApiSpec

  @Column({ type: "bool", nullable: false, default: false })
  fullTraceCaptureEnabled: boolean

  @Column({ nullable: true })
  graphQlSchema: string

  @Column({ type: "jsonb", nullable: false, default: {} })
  graphQlMetadata: Record<string, any>

  @Column({ nullable: true })
  token_0: string

  @Column({ nullable: true })
  token_1: string

  @Column({ nullable: true })
  token_2: string

  @Column({ nullable: true })
  token_3: string

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

  updateDates(traceCreatedDate: Date) {
    if (!this.firstDetected) {
      this.firstDetected = traceCreatedDate
    }
    if (!this.lastActive) {
      this.lastActive = traceCreatedDate
    }

    if (traceCreatedDate && traceCreatedDate < this.firstDetected) {
      this.firstDetected = traceCreatedDate
    }
    if (traceCreatedDate && traceCreatedDate > this.lastActive) {
      this.lastActive = traceCreatedDate
    }
  }
}
