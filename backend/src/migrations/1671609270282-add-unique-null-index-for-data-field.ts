import { MigrationInterface, QueryRunner } from "typeorm"

export class addUniqueNullIndexForDataField1671609270282
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP CONSTRAINT "unique_constraint_data_field"`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "data_field_hash_unique" ON "data_field" (hash_record_extended(("dataSection", "dataPath", "apiEndpointUuid", "statusCode", "contentType"),0))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "data_field_hash_unique"`)
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD CONSTRAINT "unique_constraint_data_field" UNIQUE ("dataSection", "dataPath", "apiEndpointUuid", "statusCode", "contentType")`,
    )
  }
}
