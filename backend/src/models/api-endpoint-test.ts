import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm"
import { Request } from "@metlo/testing"
import { ApiEndpoint } from "models/api-endpoint"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class ApiEndpointTest extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: false })
  name: string

  @Column({ type: "jsonb", nullable: true })
  tags: string[]

  @Column({ type: "jsonb", nullable: true })
  requests: Request[]

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint
}
