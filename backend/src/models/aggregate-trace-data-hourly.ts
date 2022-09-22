import {
  Entity,
  Unique,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { ApiEndpoint } from "./api-endpoint"

@Entity()
@Unique("unique_constraint_hourly", ["apiEndpoint", "hour"])
export class AggregateTraceDataHourly extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  numCalls: number

  @Column({ type: "timestamptz" })
  hour: Date

  @Column()
  apiEndpointUuid: string

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint
}
