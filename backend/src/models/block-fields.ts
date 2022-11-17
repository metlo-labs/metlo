import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm"
import { DisableRestMethod } from "@common/enums"
import MetloBaseEntity from "./metlo-base-entity"
import { DisabledPathSection } from "@common/types"

@Entity()
export class BlockFields extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  path: string

  @Column()
  pathRegex: string

  @Column({
    type: "enum",
    enum: DisableRestMethod,
    enumName: "disable_rest_method_enum",
  })
  method: DisableRestMethod

  @Column()
  host: string

  @Column({ type: "integer", nullable: false, default: 0 })
  numberParams: number

  @Column({ type: "jsonb", nullable: true, default: null })
  disabledPaths: DisabledPathSection
}
