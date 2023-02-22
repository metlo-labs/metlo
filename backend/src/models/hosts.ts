import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
@Unique("unique_host_per_org", ["host"])
export class Hosts extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  host: string

  @Column({ default: false })
  isPublic: boolean
}
