import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class InstanceSettings extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column({ nullable: true })
  updateEmail: string

  @Column({ nullable: true })
  skippedUpdateEmail: boolean
}
