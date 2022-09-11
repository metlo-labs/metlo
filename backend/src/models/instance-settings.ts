import { BaseEntity, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class InstanceSettings extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string
}
