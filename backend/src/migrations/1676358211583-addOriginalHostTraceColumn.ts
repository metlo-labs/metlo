import { MigrationInterface, QueryRunner } from "typeorm"

export class addOriginalHostTraceColumn1676358211583
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_trace ADD COLUMN IF NOT EXISTS "originalHost" text`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_trace DROP COLUMN IF EXISTS "originalHost"`,
    )
  }
}
