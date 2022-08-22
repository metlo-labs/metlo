import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DataField } from "models/data-field";
import { Alert } from "models/alert";
import { OpenApiSpec } from "models/openapi-spec";
import { DataClass, RestMethod, RiskScore } from "@common/enums";

@Entity()
export class ApiEndpoint extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false })
  pathRegex: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @Column({ nullable: false })
  host: string;

  @Column({ type: "integer", default: 0 })
  totalCalls: number;

  @Column({ type: "enum", enum: RestMethod })
  method: RestMethod;

  @Column({ type: "enum", enum: RiskScore, default: RiskScore.NONE })
  riskScore: RiskScore;

  @Column({ nullable: true })
  owner: string;

  @OneToMany(() => DataField, (dataField) => dataField.apiEndpoint, {
    cascade: ["insert"],
  })
  dataFields: DataField[];

  @OneToMany(() => Alert, (alert) => alert.apiEndpoint, { cascade: true })
  alerts: Alert[];

  @Column({ nullable: true })
  openapiSpecName: string;

  @ManyToOne(() => OpenApiSpec)
  @JoinColumn()
  openapiSpec: OpenApiSpec;

  addDataField(dataField: DataField) {
    if (this.dataFields == null) {
      this.dataFields = Array<DataField>();
    }
    this.dataFields.push(dataField);
  }

  addAlert(alert: Alert) {
    if (this.alerts == null) {
      this.alerts = Array<Alert>();
    }
    this.alerts.push(alert);
  }

  existingDataField(dataPath: string, dataClass: DataClass) {
    if (this.dataFields == null) {
      this.dataFields = Array<DataField>();
    }
    for (const dataField of this.dataFields) {
      if (
        (dataField.dataClass === dataClass &&
          dataField.dataPath === dataPath) ||
        (dataClass === null && dataField.dataPath === dataPath)
      ) {
        return dataField;
      }
    }
    return null;
  }
}
