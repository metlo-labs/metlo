import { MigrationInterface, QueryRunner } from "typeorm"

export class addFullTraceCaptureEnabledColumn1676065168441
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint ADD COLUMN IF NOT EXISTS "fullTraceCaptureEnabled" BOOLEAN NOT NULL DEFAULT FALSE`,
    )
    await queryRunner.query(
      `ALTER TABLE api_trace ADD COLUMN IF NOT EXISTS "redacted" BOOLEAN NOT NULL DEFAULT TRUE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint DROP COLUMN IF EXISTS "fullTraceCaptureEnabled"`,
    )
    await queryRunner.query(
      `ALTER TABLE api_trace DROP COLUMN IF EXISTS "redacted"`,
    )
  }
}
