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

  @Column()
  host: string

  @Column()
  environment: string

  @Column({ type: "enum", enum: RestMethod })
  method: RestMethod

  @Column()
  owner: string

  @Column({ type: "jsonb", nullable: true})
  requestParameters: Parameter[]

  @Column({ type: "jsonb", nullable: true})
  requestHeaders: Header[]

  @Column()
  requestBody: string

  @Column({type: "integer"})
  responseStatus: number

  @Column({ type: "jsonb", nullable: true})
  responseParameters: Parameter[]

  @Column({ type: "jsonb", nullable: true})
  responseHeaders: Header[]

  @Column()
  responseBody: string

  @Column({ type: "jsonb", nullable: true})
  meta: Meta
}
