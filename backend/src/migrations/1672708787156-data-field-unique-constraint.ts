import { MigrationInterface, QueryRunner } from "typeorm"

export class dataFieldUniqueConstraint1672708787156
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "data_field_hash_unique"`)

    await queryRunner.query(
      `
        UPDATE "data_field"
        SET "statusCode" = -1
        WHERE "statusCode" IS NULL
        `,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "statusCode" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "statusCode" SET DEFAULT -1`,
    )

    await queryRunner.query(
      `
        UPDATE "data_field"
        SET "contentType" = ''
        WHERE "contentType" IS NULL
        `,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "contentType" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "contentType" SET DEFAULT ''`,
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
      `ALTER TABLE "data_field" ALTER COLUMN "statusCode" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "contentType" DROP NOT NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "data_field_hash_unique" ON "data_field" (hash_record_extended(("dataSection", "dataPath", "apiEndpointUuid", "statusCode", "contentType"),0))`,
    )
  }
}
