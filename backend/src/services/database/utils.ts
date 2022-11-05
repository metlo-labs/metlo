import { QueryRunner } from "typeorm"
import { MetloContext } from "types"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { EntityTarget } from "typeorm/common/EntityTarget"
import { AppDataSource } from "data-source"

export const createQB = (ctx: MetloContext) => {
  let qb = AppDataSource.createQueryBuilder()
  qb.where = qb.andWhere
  return qb
}

export const getQB = (ctx: MetloContext, queryRunner: QueryRunner) => {
  let qb = queryRunner.manager.createQueryBuilder()
  qb.where = qb.andWhere
  return qb
}

export function getRepoQB<Entity extends ObjectLiteral>(
  ctx: MetloContext,
  target: EntityTarget<Entity>,
  alias?: string,
) {
  let qb = AppDataSource.getRepository(target).createQueryBuilder(alias)
  qb.where = qb.andWhere
  return qb
}
