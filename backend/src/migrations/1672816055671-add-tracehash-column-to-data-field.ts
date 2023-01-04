import { MigrationInterface, QueryRunner } from "typeorm"

export class addTracehashColumnToDataField1672816055671
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD "traceHash" jsonb NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_field" DROP COLUMN "traceHash"`)
  }
}
