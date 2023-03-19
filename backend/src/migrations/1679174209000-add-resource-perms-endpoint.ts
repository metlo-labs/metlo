import { MigrationInterface, QueryRunner } from "typeorm"

export class addResourcePermsEndpoint1679174209000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "resourcePermissions" character varying array NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "resourcePermissions"`,
    )
  }
}
