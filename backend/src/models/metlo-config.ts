import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class MetloConfig extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  configString: string
}
