import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BeforeInsert,
} from "typeorm"
import { DisableRestMethod } from "@common/enums"
import { isParameter } from "utils"
import { getPathTokens } from "@common/utils"

@Entity()
export class BlockFields extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  path: string

  @Column()
  pathRegex: string

  @Column({
    type: "enum",
    enum: DisableRestMethod,
    enumName: "disable_rest_method_enum",
  })
  method: DisableRestMethod

  @Column()
  host: string

  @Column({ type: "integer", nullable: false, default: 0 })
  numberParams: number

  @Column("varchar", { array: true, default: [] })
  disabledPaths: string[]

  @BeforeInsert()
  addNumberParams() {
    let numParams = 0
    if (this.pathRegex === "^/.*$") {
      numParams += 1000
    } else if (this.method === DisableRestMethod.ALL) {
      numParams += 500
    }
    if (this.path) {
      const pathTokens = getPathTokens(this.path)
      for (let i = 0; i < pathTokens.length; i++) {
        const token = pathTokens[i]
        if (isParameter(token)) {
          numParams += 1
        }
      }
      this.numberParams = numParams
    }
  }
}
