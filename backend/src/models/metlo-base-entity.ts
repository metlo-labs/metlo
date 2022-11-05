import { BaseEntity } from "typeorm"
import { MetloContext } from "types"

export default class MetloBaseEntity extends BaseEntity {
  static getTableName(ctx: MetloContext) {
    return this.getRepository().metadata.tableName
  }
}
