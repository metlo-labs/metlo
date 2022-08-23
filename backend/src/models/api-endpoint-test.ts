import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Request } from "@common/testing/types";
import { ApiEndpoint } from "models/api-endpoint";

@Entity()
export class ApiEndpointTest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: "jsonb", nullable: true })
  tags: string[];

  @Column({ type: "jsonb", nullable: true })
  requests: Request[];

  @ManyToOne(() => ApiEndpoint)
  @JoinColumn()
  apiEndpoint: ApiEndpoint;
}
