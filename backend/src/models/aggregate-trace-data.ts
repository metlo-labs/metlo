import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm"
import { ApiEndpoint } from "./api-endpoint"

@Entity()
@Unique("unique_constraint", ["apiEndpoint", "minute"])
export class AggregateTraceData extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  numCalls: number

  @Column({ type: "timestamptz" })
  minute: Date

  @Column()
  maxRPS: number

  @Column()
  minRPS: number

  @Column({ type: "numeric" })
  meanRPS: number

  @Column({ type: "jsonb", default: {} })
  countByStatusCode: Record<string, number>

  @Column()
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint
}
