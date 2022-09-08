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

  @Column({ type: "enum", enum: DisableRestMethod })
  method: DisableRestMethod

  @Column()
  host: string

  @Column({ type: "integer", nullable: false, default: 0 })
  numberParams: number

  @Column("varchar", { array: true, default: [] })
  disabledPaths: string[]

  @BeforeInsert()
  addNumberParams() {
    if (this.path) {
      const pathTokens = getPathTokens(this.path)
      let numParams = 0
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
