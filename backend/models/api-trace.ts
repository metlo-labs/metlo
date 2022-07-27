import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Header, Meta, Parameter } from "../src/types";
import { RestMethod } from "../src/enums";

@Entity()
export class ApiTrace extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: false })
  path: string

  @CreateDateColumn({ type: "timestamptz"})
  createdAt: Date

  @Column({ nullable: false })
  host: string

  @Column({ nullable: false })
  environment: string

  @Column({ type: "enum", enum: RestMethod })
  method: RestMethod

  @Column({ nullable: true })
  owner: string

  @Column({ type: "jsonb", nullable: true})
  requestParameters: Parameter[]

  @Column({ type: "jsonb", nullable: true})
  requestHeaders: Header[]

  @Column({ nullable: true })
  requestBody: string

  @Column({type: "integer"})
  responseStatus: number

  @Column({ type: "jsonb", nullable: true})
  responseHeaders: Header[]

  @Column({ nullable: true })
  responseBody: string

  @Column({ type: "jsonb", nullable: true})
  meta: Meta
}
