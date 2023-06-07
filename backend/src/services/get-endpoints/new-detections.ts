import {
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
  In,
  And,
} from "typeorm"
import {
  GetNewDetectionsParams,
  NewDetectionsAggRes,
} from "@common/api/endpoint"
import { NewDetectionType } from "@common/enums"
import { AppDataSource } from "data-source"
import { ApiEndpoint, DataField } from "models"
import { getRepository } from "services/database/utils"
import { MetloContext } from "types"
import { getNewDetectionsAggQuery } from "./queries"
import { RedisClient } from "utils/redis"

export const getNewDetections = async (
  ctx: MetloContext,
  params: GetNewDetectionsParams,
) => {
  if (params.detectionType === NewDetectionType.DATA_FIELD) {
    const whereFilters: FindOptionsWhere<DataField> = {}
    if (params.start && params.end) {
      whereFilters.createdAt = And(
        MoreThanOrEqual(new Date(params.start)),
        LessThanOrEqual(new Date(params.end)),
      )
    } else if (params.start) {
      whereFilters.createdAt = MoreThanOrEqual(new Date(params.start))
    } else if (params.end) {
      whereFilters.createdAt = LessThanOrEqual(new Date(params.end))
    }
    if (
      params.detectionHosts?.length > 0 &&
      params.detectionRiskScores?.length > 0
    ) {
      whereFilters.apiEndpoint = {
        host: In(params.detectionHosts),
        riskScore: In(params.detectionRiskScores),
      }
    } else if (params.detectionRiskScores?.length > 0) {
      whereFilters.apiEndpoint = {
        riskScore: In(params.detectionRiskScores),
      }
    } else if (params.detectionHosts?.length > 0) {
      whereFilters.apiEndpoint = {
        host: In(params.detectionHosts),
      }
    }
    return await getRepository(ctx, DataField).findAndCount({
      where: whereFilters,
      relations: {
        apiEndpoint: true,
      },
      take: params.detectionLimit,
      skip: params.detectionOffset,
      order: {
        createdAt: "DESC",
      },
    })
  } else {
    const whereFilters: FindOptionsWhere<ApiEndpoint> = {}
    if (params.start && params.end) {
      whereFilters.createdAt = And(
        MoreThanOrEqual(new Date(params.start)),
        LessThanOrEqual(new Date(params.end)),
      )
    } else if (params.start) {
      whereFilters.createdAt = MoreThanOrEqual(new Date(params.start))
    } else if (params.end) {
      whereFilters.createdAt = LessThanOrEqual(new Date(params.end))
    }
    if (params.detectionRiskScores?.length > 0) {
      whereFilters.riskScore = In(params.detectionRiskScores)
    }
    if (params.detectionHosts?.length > 0) {
      whereFilters.host = In(params.detectionHosts)
    }
    return await getRepository(ctx, ApiEndpoint).findAndCount({
      where: whereFilters,
      take: params.detectionLimit,
      skip: params.detectionOffset,
      order: {
        createdAt: "DESC",
      },
    })
  }
}

export const getNewDetectionsAgg = async (ctx: MetloContext) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    const res: NewDetectionsAggRes[] = await queryRunner.query(
      getNewDetectionsAggQuery(ctx),
    )
    return res
  } catch (err) {
    throw new Error(err)
  } finally {
    await queryRunner.release()
  }
}

export const getNewDetectionsAggCached = async (ctx: MetloContext) => {
  const cacheRes: NewDetectionsAggRes[] | null = await RedisClient.getFromRedis(
    ctx,
    "newDetectionsAggCached",
  )
  if (cacheRes !== null) {
    return cacheRes
  }
  const realRes = await getNewDetectionsAgg(ctx)
  await RedisClient.addToRedis(ctx, "newDetectionsAggCached", realRes, 3600)
  return realRes
}
