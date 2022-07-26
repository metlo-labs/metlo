import { Entity, BaseEntity, Column, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { DataClass } from "../src/enums";
import { ApiTrace } from "./api-trace";

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

  @ManyToOne(() => ApiTrace, apiTrace => apiTrace.sensitiveDataClasses)
  apiTrace: ApiTrace
}
