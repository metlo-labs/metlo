import { MigrationInterface, QueryRunner } from "typeorm"

export class addTracehashColumnToDataField1672962660470
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "traceHash" jsonb NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_field" DROP COLUMN "traceHash"`)
  }
}
