import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm"
import { AuthType } from "@common/enums"
import MetloBaseEntity from "./metlo-base-entity"

@Entity()
export class AuthenticationConfig extends MetloBaseEntity {
  @PrimaryColumn()
  host: string

  @Column({ type: "enum", enum: AuthType })
  authType: AuthType

  @Column({ nullable: true })
  headerKey: string

  @Column({ nullable: true })
  jwtUserPath: string

  @Column({ nullable: true })
  cookieName: string
}
