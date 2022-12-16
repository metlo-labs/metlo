import { MigrationInterface, QueryRunner } from "typeorm"

export class addHostsColumnToWebhook1671143857165
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "webhook" ADD COLUMN IF NOT EXISTS "hosts" character varying array NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "webhook" DROP COLUMN IF EXISTS "hosts"`,
    )
  }
}
