import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class Hosts extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  host: string

  @Column({ default: false })
  isPublic: boolean
}
