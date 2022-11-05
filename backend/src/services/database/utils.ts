import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryRunner,
  Repository,
  SaveOptions,
} from "typeorm"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { EntityTarget } from "typeorm/common/EntityTarget"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"

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

export class WrappedRepository<Entity extends ObjectLiteral> {
  ctx: MetloContext
  repository: Repository<Entity>

  constructor(ctx: MetloContext, repository: Repository<Entity>) {
    this.repository = repository
    this.ctx = ctx
  }

  count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.repository.count(options)
  }

  countBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<number> {
    return this.repository.countBy(where)
  }

  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.repository.find(options)
  }

  findBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity[]> {
    return this.repository.findBy(where)
  }

  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.repository.findOne(options)
  }

  findOneBy(
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity | null> {
    return this.repository.findOneBy(where)
  }

  findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return this.repository.findAndCount(options)
  }

  save<Entity, T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ) {
    return this.repository.manager.save(
      this.repository.metadata.target,
      entity,
      options,
    )
  }
}

export function getRepository<Entity extends ObjectLiteral>(
  ctx: MetloContext,
  target: EntityTarget<Entity>,
) {
  const repo = AppDataSource.getRepository(target)
  return new WrappedRepository(ctx, repo)
}
