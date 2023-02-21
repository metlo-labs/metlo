import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class TestingConfig extends MetloBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  configString: string
}
