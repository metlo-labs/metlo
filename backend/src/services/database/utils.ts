import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  QueryRunner,
  RemoveOptions,
  Repository,
  SaveOptions,
} from "typeorm"
import { ObjectLiteral } from "typeorm/common/ObjectLiteral"
import { EntityTarget } from "typeorm/common/EntityTarget"
import { AppDataSource } from "data-source"
import { MetloContext } from "types"
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity"

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

export class WrappedEntityManager {
  ctx: MetloContext
  manager: EntityManager

  constructor(ctx: MetloContext, manager: EntityManager) {
    this.manager = manager
    this.ctx = ctx
  }

  find<Entity>(
    entityClass: EntityTarget<Entity>,
    options?: FindManyOptions<Entity>,
  ): Promise<Entity[]> {
    return this.manager.find(entityClass, options)
  }

  findOne<Entity>(
    entityClass: EntityTarget<Entity>,
    options: FindOneOptions<Entity>,
  ): Promise<Entity | null> {
    return this.manager.findOne(entityClass, options)
  }

  findOneBy<Entity>(
    entityClass: EntityTarget<Entity>,
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity | null> {
    return this.manager.findOneBy(entityClass, where)
  }

  save<Entity>(
    targetOrEntity: Entity,
    maybeEntityOrOptions?: SaveOptions,
  ): Promise<Entity>
  save<Entity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    maybeEntityOrOptions: T,
    maybeOptions?: SaveOptions,
  ) {
    return this.manager.save(targetOrEntity, maybeEntityOrOptions, maybeOptions)
  }

  remove<Entity>(entity: Entity, options?: RemoveOptions): Promise<Entity> {
    return this.manager.remove(entity, options)
  }

  insert<Entity>(
    target: EntityTarget<Entity>,
    entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
    return this.manager.insert(target, entity)
  }
}

export function getEntityManager(ctx: MetloContext, queryRunner: QueryRunner) {
  return new WrappedEntityManager(ctx, queryRunner.manager)
}
