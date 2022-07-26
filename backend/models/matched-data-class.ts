import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { DataClass } from "../src/enums";
import { ApiEndpoint } from "./api-endpoint";

@Entity()
export class MatchedDataClass extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ type: "enum", enum: DataClass})
  dataClass: DataClass

  @CreateDateColumn({ type: "timestamptz"})
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz"})
  updatedAt: Date

  @Column()
  dataPath: string

  @Column({ type: "bool" })
  isRisk: boolean

  @ManyToOne(() => ApiEndpoint, apiTrace => apiTrace.sensitiveDataClasses)
  apiEndpoint: ApiEndpoint
}
