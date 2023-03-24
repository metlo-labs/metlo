import { MigrationInterface, QueryRunner } from "typeorm"

export class apiEndpointTokenColumns1679515538397
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_0" varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_1" varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_2" varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "token_3" varchar`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_0_api_endpoint_idx" ON "api_endpoint" ("token_0")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_1_api_endpoint_idx" ON "api_endpoint" ("token_1")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_2_api_endpoint_idx" ON "api_endpoint" ("token_2")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "token_3_api_endpoint_idx" ON "api_endpoint" ("token_3")`,
    )
    await queryRunner.query(`
        UPDATE api_endpoint
        SET
        token_0 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 0 THEN REGEXP_REPLACE(split_part(path, '/', 2), '^{.*}$', '{param}') ELSE NULL END),
        token_1 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 1 THEN REGEXP_REPLACE(split_part(path, '/', 3), '^{.*}$', '{param}') ELSE NULL END),
        token_2 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 2 THEN REGEXP_REPLACE(split_part(path, '/', 4), '^{.*}$', '{param}') ELSE NULL END),
        token_3 = (CASE WHEN (CHAR_LENGTH(path) - CHAR_LENGTH(REPLACE(path, '/', ''))) > 3 THEN REGEXP_REPLACE(split_part(path, '/', 5), '^{.*}$', '{param}') ELSE NULL END)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_2"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_3"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "token_4"`,
    )
  }
}
