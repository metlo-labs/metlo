import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectID,
  QueryRunner,
  RemoveOptions,
  Repository,
  SaveOptions,
  UpdateResult,
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

export function insertValueBuilder<Entity extends ObjectLiteral>(
  ctx: MetloContext,
  queryRunner: QueryRunner,
  into: EntityTarget<Entity>,
  value: QueryDeepPartialEntity<Entity>,
) {
  return getQB(ctx, queryRunner).insert().into(into).values(value)
}

export function insertValuesBuilder<Entity extends ObjectLiteral>(
  ctx: MetloContext,
  queryRunner: QueryRunner,
  into: EntityTarget<Entity>,
  values: QueryDeepPartialEntity<Entity>[],
) {
  return getQB(ctx, queryRunner).insert().into(into).values(values)
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

  countBy(where: FindOptionsWhere<Entity>): Promise<number> {
    return this.repository.countBy(where)
  }

  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.repository.find(options)
  }

  findBy(where: FindOptionsWhere<Entity>): Promise<Entity[]> {
    return this.repository.findBy(where)
  }

  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.repository.findOne(options)
  }

  findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null> {
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
    where: FindOptionsWhere<Entity>,
  ): Promise<Entity | null> {
    return this.manager.findOneBy(entityClass, where)
  }

  save<Entity>(target: Entity, options?: SaveOptions): Promise<Entity> {
    return this.manager.save(target, options)
  }

  saveList<Entity>(target: Entity[], options?: SaveOptions): Promise<Entity[]> {
    return this.manager.save(target, options)
  }

  remove<Entity>(entity: Entity, options?: RemoveOptions): Promise<Entity> {
    return this.manager.remove(entity, options)
  }

  insert<Entity>(
    target: EntityTarget<Entity>,
    entity: QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
    return this.manager.insert(target, entity)
  }

  update<Entity>(
    target: EntityTarget<Entity>,
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | any,
    entity: QueryDeepPartialEntity<
      ObjectLiteral extends Entity ? unknown : Entity
    >,
  ): Promise<UpdateResult> {
    return this.manager.update(target, criteria, entity)
  }
}

export function getEntityManager(ctx: MetloContext, queryRunner: QueryRunner) {
  return new WrappedEntityManager(ctx, queryRunner.manager)
}
