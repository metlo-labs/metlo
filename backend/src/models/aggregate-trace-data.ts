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
@Unique("unique_constraint", ["apiEndpoint", "hour"])
export class AggregateTraceData extends BaseEntity {
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
