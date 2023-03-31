import { Response } from "express"
import { Not, QueryRunner, Raw } from "typeorm"
import { updateDataClasses, deleteDataField } from "services/data-field"
import {
  UpdateDataFieldClassesParamsSchema,
  UpdateDataFieldEntitySchema,
  UpdateDataFieldPathSchema,
} from "@common/api/endpoint"
import ApiResponseHandler from "api-response-handler"
import { GetEndpointsService } from "services/get-endpoints"
import { MetloContext, MetloRequest } from "types"
import { AppDataSource } from "data-source"
import {
  createQB,
  getEntityManager,
  getQB,
  getRepoQB,
} from "services/database/utils"
import { Alert, ApiEndpoint, DataField } from "models"
import Error500InternalServer from "errors/error-500-internal-server"
import { AlertType, DataSection, RiskScore } from "@common/enums"
import {
  getEntityTagsCached,
  getTemplateConfig,
  getTestingConfigCached,
} from "services/testing-config"
import Error400BadRequest from "errors/error-400-bad-request"
import { populateEndpointPerms } from "services/testing-config/populate-endpoint-perms"
import Error409Conflict from "errors/error-409-conflict"
import Error404NotFound from "errors/error-404-not-found"

export const updateDataFieldClasses = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { dataFieldId } = req.params
  const parsedBody = UpdateDataFieldClassesParamsSchema.safeParse(req.body)
  if (parsedBody.success == false) {
    return await ApiResponseHandler.zerr(res, parsedBody.error)
  }
  try {
    const { dataClasses, dataPath, dataSection } = parsedBody.data
    const updatedDataField = await updateDataClasses(
      req.ctx,
      dataFieldId,
      dataClasses,
      dataPath,
      dataSection,
    )
    if (updatedDataField) {
      await GetEndpointsService.updateEndpointRiskScore(
        req.ctx,
        updatedDataField.apiEndpointUuid,
      )
    }
    await ApiResponseHandler.success(res, updatedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteDataFieldHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { dataFieldId } = req.params
    const removedDataField = await deleteDataField(req.ctx, dataFieldId)
    if (removedDataField) {
      await GetEndpointsService.updateEndpointRiskScore(
        req.ctx,
        removedDataField.apiEndpointUuid,
      )
    }
    await ApiResponseHandler.success(res, removedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const bulkDeleteDataFieldsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    await createQB(req.ctx).delete().from(DataField).execute()
    await createQB(req.ctx)
      .update(ApiEndpoint)
      .set({
        riskScore: RiskScore.NONE,
      })
      .execute()
    await createQB(req.ctx)
      .delete()
      .from(Alert)
      .andWhere(`"type" IN(:...alertTypes)`, {
        alertTypes: [
          AlertType.PII_DATA_DETECTED,
          AlertType.QUERY_SENSITIVE_DATA,
          AlertType.PATH_SENSITIVE_DATA,
          AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA,
        ],
      })
      .execute()
    await ApiResponseHandler.success(res, "OK")
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const clearAllSensitiveDataHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    await getQB(req.ctx, queryRunner)
      .update(DataField)
      .set({
        dataClasses: [],
        falsePositives: [],
        scannerIdentified: [],
        dataTag: null,
      })
      .execute()
    await getQB(req.ctx, queryRunner)
      .update(ApiEndpoint)
      .set({
        riskScore: RiskScore.NONE,
      })
      .execute()
    await getQB(req.ctx, queryRunner)
      .delete()
      .from(Alert)
      .andWhere(`"type" IN(:...alertTypes)`, {
        alertTypes: [
          AlertType.PII_DATA_DETECTED,
          AlertType.QUERY_SENSITIVE_DATA,
          AlertType.PATH_SENSITIVE_DATA,
          AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA,
        ],
      })
      .execute()
    await queryRunner.commitTransaction()
    await ApiResponseHandler.success(res, "OK")
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw new Error500InternalServer(err)
  } finally {
    await queryRunner.release()
  }
}

export const updateDataFieldEntityHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { dataFieldId } = req.params
  const parsedBody = UpdateDataFieldEntitySchema.safeParse(req.body)
  if (parsedBody.success === false) {
    return await ApiResponseHandler.zerr(res, parsedBody.error)
  }
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    const { entity } = parsedBody.data
    const entityTags = await getEntityTagsCached(req.ctx)
    if (entity && !entityTags.includes(entity)) {
      throw new Error400BadRequest(`${entity} is not a valid entity.`)
    }
    await queryRunner.connect()
    await getQB(req.ctx, queryRunner)
      .update(DataField)
      .set({ entity: entity })
      .andWhere("uuid = :id", { id: dataFieldId })
      .execute()
    const testingConf = await getTemplateConfig(req.ctx)
    if (testingConf) {
      await populateEndpointPerms(req.ctx, queryRunner, testingConf)
    }
    const updatedDataField = await getEntityManager(
      req.ctx,
      queryRunner,
    ).findOneBy(DataField, { uuid: dataFieldId })
    await ApiResponseHandler.success(res, updatedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release()
    }
  }
}

const updateRequestPathDataPath = async (
  ctx: MetloContext,
  dataField: DataField,
  newDataPath: string,
  queryRunner: QueryRunner,
) => {
  const apiEndpoint = await getEntityManager(ctx, queryRunner).findOne(
    ApiEndpoint,
    {
      select: {
        uuid: true,
        path: true,
      },
      where: {
        uuid: dataField.apiEndpointUuid,
      },
    },
  )
  await queryRunner.startTransaction()
  await getRepoQB(ctx, DataField)
    .update()
    .set({ dataPath: newDataPath })
    .andWhere("uuid = :id", { id: dataField.uuid })
    .execute()
  const newPath = apiEndpoint.path.replace(
    `{${dataField.dataPath}}`,
    `{${newDataPath}}`,
  )
  await getRepoQB(ctx, ApiEndpoint)
    .update()
    .set({ path: newPath })
    .andWhere("uuid = :id", { id: apiEndpoint.uuid })
    .execute()
  await queryRunner.commitTransaction()
}

const getUpdatedDataPaths = async (
  ctx: MetloContext,
  dataField: DataField,
  newDataPath: string,
  queryRunner: QueryRunner,
) => {
  const splitPath = newDataPath?.split(".")
  const updatedIndexes = []
  let isStringPath = false
  const regexSplitPath = splitPath?.map((e, idx) => {
    if (e === "[string]") {
      updatedIndexes.push(idx)
      isStringPath = true
      return String.raw`[^\.(\[\])]+`
    } else if (e === "[]") {
      return String.raw`\[\]`
    } else if (isStringPath) {
      return String.raw`[^\.(\[\])]+`
    } else {
      return e.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")
    }
  })
  const pathRegex = regexSplitPath.join(String.raw`\.`)
  const matchingDataFields = await getEntityManager(ctx, queryRunner).find(
    DataField,
    {
      select: {
        uuid: true,
        dataPath: true,
      },
      where: {
        dataPath: Raw(alias => `${alias} ~ :path`, { path: pathRegex }),
        dataSection: dataField.dataSection,
        apiEndpointUuid: dataField.apiEndpointUuid,
        contentType: dataField.contentType,
        statusCode: dataField.statusCode,
        uuid: Not(dataField.uuid),
      },
    },
  )

  const resp: {
    deleted: string[]
    updated: Record<string, any>
    updateDataFields: DataField[]
  } = {
    updated: { [dataField.uuid]: { ...dataField, dataPath: newDataPath } },
    deleted: [],
    updateDataFields: [],
  }

  for (const e of matchingDataFields) {
    const split = e.dataPath.split(".")
    if (split.length !== splitPath.length) {
      continue
    }
    if (updatedIndexes.length > 0) {
      for (const idx of updatedIndexes) {
        split[idx] = "[string]"
      }
      e.dataPath = split.join(".")
    }
    if (e.dataPath === newDataPath) {
      resp.deleted.push(e.uuid)
    } else {
      resp.updateDataFields.push(e)
      resp.updated[e.uuid] = e
    }
  }
  return resp
}

export const updateDataFieldPathHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { dataFieldId } = req.params
  const parsedBody = UpdateDataFieldPathSchema.safeParse(req.body)
  if (parsedBody.success === false) {
    return await ApiResponseHandler.zerr(res, parsedBody.error)
  }
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    let { dataPath } = parsedBody.data
    dataPath = dataPath.trim()
    await queryRunner.connect()
    const dataField = await getEntityManager(req.ctx, queryRunner).findOne(
      DataField,
      { where: { uuid: dataFieldId } },
    )
    if (!dataField) {
      throw new Error404NotFound("Data field not found.")
    }
    const existingDataPath = await getEntityManager(
      req.ctx,
      queryRunner,
    ).findOne(DataField, {
      select: {
        uuid: true,
      },
      where: {
        dataPath,
        dataSection: dataField.dataSection,
        apiEndpointUuid: dataField.apiEndpointUuid,
        contentType: dataField.contentType,
        statusCode: dataField.statusCode,
      },
    })
    if (existingDataPath) {
      throw new Error409Conflict(
        "Data Field already exists with this data path.",
      )
    }

    if (dataField.dataSection === DataSection.REQUEST_PATH) {
      await updateRequestPathDataPath(req.ctx, dataField, dataPath, queryRunner)
      return await ApiResponseHandler.success(res, {
        updated: { [dataField.uuid]: { ...dataField, dataPath } },
      })
    }

    const resp = await getUpdatedDataPaths(
      req.ctx,
      dataField,
      dataPath,
      queryRunner,
    )

    await queryRunner.startTransaction()
    await getQB(req.ctx, queryRunner)
      .delete()
      .from(DataField)
      .andWhereInIds(resp.deleted)
      .execute()
    await getEntityManager(req.ctx, queryRunner).saveList(resp.updateDataFields)
    await getRepoQB(req.ctx, DataField)
      .update()
      .set({ dataPath })
      .andWhere("uuid = :id", { id: dataField.uuid })
      .execute()
    await queryRunner.commitTransaction()

    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    await ApiResponseHandler.error(res, err)
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release()
    }
  }
}
