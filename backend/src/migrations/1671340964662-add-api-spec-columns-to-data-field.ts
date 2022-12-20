import { MigrationInterface, QueryRunner } from "typeorm"

export class addApiSpecColumnsToDataField1671340964662
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "statusCode" integer`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "contentType" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "arrayFields" jsonb`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "isNullable" boolean`
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP CONSTRAINT "unique_constraint_data_field"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD CONSTRAINT "unique_constraint_data_field" UNIQUE ("dataSection", "dataPath", "apiEndpointUuid", "statusCode", "contentType")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP CONSTRAINT "unique_constraint_data_field"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "statusCode"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "contentType"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "arrayFields"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "isNullable"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD CONSTRAINT "unique_constraint_data_field" UNIQUE ("dataSection", "dataPath", "apiEndpointUuid")`,
    )
  }
}
