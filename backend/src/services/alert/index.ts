import {
  FindOptionsWhere,
  FindManyOptions,
  In,
  FindOptionsOrder,
} from "typeorm"
import validator from "validator"
import { Alert } from "models"
import { Status, UpdateAlertType } from "@common/enums"
import { Alert as AlertResponse } from "@common/types"
import {
  GetAlertParams,
  UpdateAlertBatchParams,
  UpdateAlertParams,
} from "@common/api/alert"
import Error409Conflict from "errors/error-409-conflict"
import Error500InternalServer from "errors/error-500-internal-server"
import Error404NotFound from "errors/error-404-not-found"
import {
  createQB,
  getEntityManager,
  getQB,
  getRepository,
} from "services/database/utils"
import { MetloContext } from "types"
import { AppDataSource } from "data-source"

export const updateAlert = async (
  ctx: MetloContext,
  alertId: string,
  updateAlertParams: UpdateAlertParams,
): Promise<Alert> => {
  const alertRepository = getRepository(ctx, Alert)
  const alert = await alertRepository.findOne({
    where: {
      uuid: alertId,
    },
    relations: {
      apiEndpoint: true,
    },
  })
  if (!alert) {
    throw new Error404NotFound("Not Found")
  }
  switch (updateAlertParams.updateType) {
    case UpdateAlertType.IGNORE:
      if (alert.status === Status.IGNORED) {
        throw new Error409Conflict("Alert is already being ignored.")
      } else if (alert.status === Status.RESOLVED) {
        throw new Error409Conflict("Alert is resolved and cannot be ignored.")
      }
      alert.status = Status.IGNORED
      break
    case UpdateAlertType.UNIGNORE:
      if (alert.status !== Status.IGNORED) {
        throw new Error409Conflict("Alert is currently not ignored.")
      }
      alert.status = Status.OPEN
      break
    case UpdateAlertType.RESOLVE:
      if (alert.status === Status.RESOLVED) {
        throw new Error409Conflict("Alert is already resolved.")
      } else if (alert.status === Status.IGNORED) {
        throw new Error409Conflict("Alert is ignored and cannot be resolved.")
      }
      alert.status = Status.RESOLVED
      alert.resolutionMessage =
        updateAlertParams.resolutionMessage?.trim() || null
      break
    case UpdateAlertType.UNRESOLVE:
      if (alert.status !== Status.RESOLVED) {
        throw new Error409Conflict("Alert is currently not resolved.")
      }
      alert.status = Status.OPEN
      break
    default:
      throw new Error500InternalServer("Unknown update type.")
  }
  await createQB(ctx)
    .update(Alert)
    .set({ status: alert.status, resolutionMessage: alert.resolutionMessage })
    .andWhere("uuid = :uuid", { uuid: alertId })
    .execute()
  return alert
}

export const updateAlertBatch = async (
  ctx: MetloContext,
  params: UpdateAlertBatchParams,
): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const alertEntityManager = getEntityManager(ctx, queryRunner)
    let whereConditions: FindOptionsWhere<Alert>[] | FindOptionsWhere<Alert> =
      {}
    let updateFields = {}

    if (params.updateType) {
      switch (params.updateType) {
        case UpdateAlertType.IGNORE:
          updateFields = { status: Status.IGNORED }
          whereConditions = { ...whereConditions, status: Status.OPEN }
          break
        case UpdateAlertType.RESOLVE:
          updateFields = {
            status: Status.RESOLVED,
            resolutionMessage: params.resolutionMessage?.trim() || null,
          }
          whereConditions = { ...whereConditions, status: Status.OPEN }
          break
        case UpdateAlertType.UNIGNORE:
          updateFields = { status: Status.OPEN }
          whereConditions = { ...whereConditions, status: Status.IGNORED }
          break
        case UpdateAlertType.UNRESOLVE:
          updateFields = { status: Status.OPEN }
          whereConditions = { ...whereConditions, status: Status.RESOLVED }
        default:
          break
      }
    }
    if (params.uuid) {
      whereConditions = { ...whereConditions, uuid: params.uuid }
    } else {
      if (params.alertTypes?.length > 0) {
        whereConditions = { ...whereConditions, type: In(params.alertTypes) }
      }
      if (params.apiEndpointUuid) {
        whereConditions = {
          ...whereConditions,
          apiEndpointUuid: params.apiEndpointUuid,
        }
      }
      if (params.hosts?.length > 0) {
        whereConditions = {
          ...whereConditions,
          apiEndpoint: { host: In(params.hosts) },
        }
      }
      if (params.riskScores?.length > 0) {
        whereConditions = {
          ...whereConditions,
          riskScore: In(params.riskScores),
        }
      }
    }
    const alertUuids = await alertEntityManager.find(Alert, {
      select: { uuid: true },
      where: whereConditions,
      relations: { apiEndpoint: true },
    })
    await getQB(ctx, queryRunner)
      .update(Alert)
      .set({ ...updateFields })
      .andWhere("uuid IN(:...ids)", { ids: alertUuids.map(e => e.uuid) })
      .execute()
  } catch (err) {
    throw err
  } finally {
    await queryRunner.release()
  }
  return
}

export const getAlerts = async (
  ctx: MetloContext,
  alertParams: GetAlertParams,
): Promise<[AlertResponse[], number]> => {
  const alertRepository = getRepository(ctx, Alert)
  let whereConditions: FindOptionsWhere<Alert>[] | FindOptionsWhere<Alert> = {}
  let paginationParams: FindManyOptions<Alert> = {}
  let orderParams: FindOptionsOrder<Alert> = {}

  if (alertParams?.uuid && validator.isUUID(alertParams?.uuid)) {
    whereConditions = {
      ...whereConditions,
      uuid: alertParams.uuid,
    }
  }
  if (
    alertParams?.apiEndpointUuid &&
    validator.isUUID(alertParams?.apiEndpointUuid)
  ) {
    whereConditions = {
      ...whereConditions,
      apiEndpointUuid: alertParams.apiEndpointUuid,
    }
  }
  if (alertParams?.alertTypes) {
    whereConditions = {
      ...whereConditions,
      type: In(alertParams.alertTypes),
    }
  }
  if (alertParams?.riskScores) {
    whereConditions = {
      ...whereConditions,
      riskScore: In(alertParams.riskScores),
    }
  }
  if (alertParams?.hosts) {
    whereConditions = {
      ...whereConditions,
      apiEndpoint: {
        host: In(alertParams.hosts),
      },
    }
  }
  if (alertParams?.status) {
    whereConditions = {
      ...whereConditions,
      status: In(alertParams.status),
    }
  }
  if (alertParams?.offset) {
    paginationParams = {
      ...paginationParams,
      skip: alertParams.offset,
    }
  }
  if (alertParams?.limit) {
    paginationParams = {
      ...paginationParams,
      take: alertParams.limit,
    }
  }
  if (alertParams?.order) {
    orderParams = {
      riskScore: alertParams.order,
    }
  } else {
    orderParams = {
      riskScore: "DESC",
    }
  }

  const alerts = await alertRepository.findAndCount({
    //@ts-ignore
    select: {
      uuid: true,
      type: true,
      riskScore: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      resolutionMessage: true,
      context: true,
      apiEndpointUuid: true,
      apiEndpoint: {
        method: true,
        uuid: true,
        path: true,
        host: true,
        openapiSpecName: true,
        openapiSpec: {
          minimizedSpecContext: true,
          extension: true,
        },
      },
    },
    where: whereConditions,
    ...paginationParams,
    relations: {
      apiEndpoint: {
        openapiSpec: true,
      },
    },
    order: {
      status: "DESC",
      ...orderParams,
      createdAt: "DESC",
    },
  })

  return alerts
}
