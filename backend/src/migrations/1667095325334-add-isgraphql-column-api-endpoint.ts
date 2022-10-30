import { MigrationInterface, QueryRunner } from "typeorm"

export class addIsgraphqlColumnApiEndpoint1667095325334
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint ADD COLUMN IF NOT EXISTS "isGraphQl" BOOLEAN NOT NULL DEFAULT FALSE`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "isGraphQl_api_endpoint" ON "api_endpoint" ("isGraphQl")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "isGraphQl_api_endpoint"`)
    await queryRunner.query(
      `ALTER TABLE api_endpoint DROP COLUMN IF EXISTS "isGraphQl"`,
    )
  }
}
