import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { ApiEndpoint } from "./api-endpoint"

@Entity()
export class AggregateTraceData extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  numCalls: number

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @Column()
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint
}
