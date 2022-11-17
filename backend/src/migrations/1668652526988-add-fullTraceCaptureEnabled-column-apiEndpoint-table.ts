import { MigrationInterface, QueryRunner } from "typeorm"

export class addFullTraceCaptureEnabledColumnApiEndpointTable1668652526988
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint ADD COLUMN IF NOT EXISTS "fullTraceCaptureEnabled" BOOLEAN NOT NULL DEFAULT FALSE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint DROP COLUMN IF EXISTS "fullTraceCaptureEnabled`,
    )
  }
}
