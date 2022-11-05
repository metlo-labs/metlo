import { MigrationInterface, QueryRunner } from "typeorm"

export class updateDisabledPathsColumnBlockFieldsTable1667606447208
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "block_fields" DROP COLUMN "disabledPaths"`,
    )
    await queryRunner.query(
      `ALTER TABLE "block_fields" ADD "disabledPaths" jsonb`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "block_fields" DROP COLUMN "disabledPaths"`,
    )
    await queryRunner.query(
      `ALTER TABLE "block_fields" ADD "disabledPaths" character varying array NOT NULL DEFAULT '{}'`,
    )
  }
}
