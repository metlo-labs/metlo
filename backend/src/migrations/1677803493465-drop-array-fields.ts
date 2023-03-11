import { MigrationInterface, QueryRunner } from "typeorm"
import { DataField } from "models"

export class dropArrayFields1677803493465 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const qb = queryRunner.manager.createQueryBuilder()
    const dataFields = await qb
      .select(["*"])
      .from(DataField, "data_field")
      .where(`"arrayFields" != '{}'`)
      .getRawMany()
    for (const dataField of dataFields) {
      const splitPath = dataField.dataPath.split(".")
      let newPath = ""
      if (dataField.arrayFields[""] && dataField.dataPath !== "") {
        for (let x = 0; x < dataField.arrayFields[""]; x++) {
          if (newPath.length === 0) newPath += "[]"
          else newPath += ".[]"
        }
      }

      for (let i = 0; i < splitPath.length; i++) {
        if (newPath.length === 0) {
          newPath += `${splitPath[i]}`
        } else {
          newPath += `.${splitPath[i]}`
        }
        const currPath = splitPath.slice(0, i + 1).join(".")
        const arrayDepth = dataField.arrayFields[currPath]
        if (arrayDepth) {
          for (let j = 0; j < arrayDepth; j++) {
            if (newPath.length === 0) newPath += "[]"
            else newPath += ".[]"
          }
        }
      }

      if (newPath !== dataField.dataPath) {
        dataField.dataPath = newPath
      }
    }
    for (let i = 0; i < dataFields.length; i += 1000) {
      const max = Math.min(i + 1000, dataFields.length)
      await qb
        .insert()
        .into(DataField, [
          "uuid",
          "dataClasses",
          "falsePositives",
          "scannerIdentified",
          "dataType",
          "dataTag",
          "dataSection",
          "createdAt",
          "updatedAt",
          "dataPath",
          "statusCode",
          "contentType",
          "isNullable",
          "traceHash",
          "matches",
          "entity",
          "apiEndpointUuid",
          "arrayFields",
        ])
        .values(dataFields.slice(i, max))
        .orUpdate(["dataPath"], ["uuid"], { skipUpdateIfNoValuesChanged: true })
        .execute()
      console.log(`Updated ${max} data fields...`)
    }
    console.log(`Finished updating ${dataFields.length} data fields.`)
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "arrayFields"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "arrayFields" jsonb NOT NULL DEFAULT '{}'`,
    )
    const qb = queryRunner.manager.createQueryBuilder()
    const dataFields = await qb
      .select(["*"])
      .from(DataField, "data_field")
      .where(`"dataPath" ILIKE :searchQuery`, { searchQuery: "%[]%" })
      .getRawMany()
    for (const dataField of dataFields) {
      let currDataPath = ""
      let updated = false
      let arrayDepth = 0
      const splitPath = dataField.dataPath.split(".")
      for (let i = 0; i < splitPath.length; i++) {
        const token = splitPath[i]
        if (token === "[]") {
          arrayDepth += 1
          dataField.arrayFields[currDataPath] = arrayDepth
        } else {
          arrayDepth = 0
          if (updated) {
            currDataPath += `.${token}`
          } else {
            currDataPath += token
            updated = true
          }
        }
      }
      if (currDataPath !== dataField.dataPath) {
        dataField.dataPath = currDataPath
      }
    }
    for (let i = 0; i < dataFields.length; i += 1000) {
      const max = Math.min(i + 1000, dataFields.length)
      await qb
        .insert()
        .into(DataField, [
          "uuid",
          "dataClasses",
          "falsePositives",
          "scannerIdentified",
          "dataType",
          "dataTag",
          "dataSection",
          "createdAt",
          "updatedAt",
          "dataPath",
          "statusCode",
          "contentType",
          "isNullable",
          "traceHash",
          "matches",
          "entity",
          "apiEndpointUuid",
          "arrayFields",
        ])
        .values(dataFields.slice(i, max))
        .orUpdate(["dataPath", "arrayFields"], ["uuid"], {
          skipUpdateIfNoValuesChanged: true,
        })
        .execute()
    }
  }
}
