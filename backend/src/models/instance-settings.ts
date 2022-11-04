import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class InstanceSettings extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: true })
  updateEmail: string

  @Column({ nullable: true })
  skippedUpdateEmail: boolean
}
