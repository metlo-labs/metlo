import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Meta, PairObject } from "../src/types";
import { RestMethod } from "../src/enums";
import { ApiEndpoint } from "./api-endpoint";

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
  requestParameters: PairObject[]

  @Column({ type: "jsonb", nullable: true})
  requestHeaders: PairObject[]

  @Column({ nullable: true })
  requestBody: string

  @Column({type: "integer"})
  responseStatus: number

  @Column({ type: "jsonb", nullable: true})
  responseHeaders: PairObject[]

  @Column({ nullable: true })
  responseBody: string

  @Column({ type: "jsonb", nullable: true})
  meta: Meta

  @Column({ nullable: true })
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint
}
