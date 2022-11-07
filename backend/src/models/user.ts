import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn
} from "typeorm"
import MetloBaseEntity from "./metlo-base-entity"
import { LoginType } from "../types"

@Entity({ name: "user" })
export class User extends MetloBaseEntity {
    @PrimaryColumn("uuid")
    // user id is github+github user id
    // user id is google+google user id
    id: string

    @Column()
    userImage: String

    @Column({
        type: "enum",
        enum: LoginType,
        enumName: "logintype_enum",
    })
    account: LoginType

    @Column({ nullable: false })
    name: string

    @Column()
    email: string

    @Column("jsonb", { nullable: false, default: {} })
    meta: object

    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date
}
