import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class GQLSchema extends MetloBaseEntity {
  @PrimaryColumn()
  name: string

  @Column()
  schema: string

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date
}
