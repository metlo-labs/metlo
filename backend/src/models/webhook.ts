import { AlertType } from "@common/enums"
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class Webhook extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: false })
  url: string

  @Column({ type: "integer", nullable: false, default: 4 })
  maxRetries: number

  @Column({ type: "varchar", array: true, default: [] })
  alertTypes: AlertType[]

  @Column({ type: "varchar", array: true, default: [] })
  errors: string[]
}
