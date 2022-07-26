import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MatchedDataClass } from "./matched-data-class";
import { RestMethod } from "../src/enums";

@Entity()
export class ApiTrace extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: false })
  path: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date

  @Column()
  host: string

  @Column()
  environment: string

  @Column({ type: "integer"})
  totalCalls: number

  @Column({ type: "enum", enum: RestMethod})
  method: RestMethod

  @Column()
  owner: string

  @OneToMany(() => MatchedDataClass, dataClass => dataClass.apiTrace)
  sensitiveDataClasses: MatchedDataClass[]
}
