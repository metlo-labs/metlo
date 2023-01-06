import { DataSection, DataTag } from "@common/enums"
import { DataField } from "models"
import Error404NotFound from "errors/error-404-not-found"
import { createQB, getRepository } from "services/database/utils"
import { MetloContext } from "types"

export const deleteDataField = async (
  ctx: MetloContext,
  dataFieldId: string,
): Promise<DataField> => {
  const dataFieldRepository = getRepository(ctx, DataField)
  const dataField = await dataFieldRepository.findOneBy({ uuid: dataFieldId })
  const fieldUuid = dataField.uuid
  if (!dataField) {
    throw new Error404NotFound("DataField for provided id not found.")
  }
  await createQB(ctx)
    .delete()
    .from(DataField)
    .andWhere("uuid = :uuid", { uuid: fieldUuid })
    .execute()
  return {
    ...dataField,
    uuid: fieldUuid,
  } as DataField
}

export const updateDataClasses = async (
  ctx: MetloContext,
  dataFieldId: string,
  dataClasses: string[],
  dataPath: string,
  dataSection: DataSection,
): Promise<DataField> => {
  const dataFieldRepository = getRepository(ctx, DataField)
  const dataField = await dataFieldRepository.findOneBy({
    uuid: dataFieldId,
    dataPath,
    dataSection,
  })
  dataField.dataClasses = dataClasses
  dataField.falsePositives = dataField.scannerIdentified.filter(
    e => !dataClasses.includes(e),
  )
  dataField.dataTag = dataField.dataClasses.length > 0 ? DataTag.PII : null
  return await dataFieldRepository.save(dataField)
}
