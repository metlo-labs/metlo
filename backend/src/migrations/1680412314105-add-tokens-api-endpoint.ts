import { MigrationInterface, QueryRunner } from "typeorm"

export class addTokensApiEndpoint1680412314105 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_4" varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_5" varchar`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_4_api_endpoint_idx" ON "api_endpoint" ("token_4")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_5_api_endpoint_idx" ON "api_endpoint" ("token_5")`,
    )
    await queryRunner.query(`
        UPDATE api_endpoint
        SET
        token_4 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 4 THEN REGEXP_REPLACE(split_part(path, '/', 6), '^{.*}$', '{param}') ELSE NULL END),
        token_5 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 5 THEN REGEXP_REPLACE(split_part(path, '/', 7), '^{.*}$', '{param}') ELSE NULL END)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_4"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_5"`,
    )
    await queryRunner.query(`DROP INDEX IF EXISTS "token_4_api_endpoint_idx"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "token_5_api_endpoint_idx"`)
  }
}
