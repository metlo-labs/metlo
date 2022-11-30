import { MigrationInterface, QueryRunner } from "typeorm"

export class removeApiKeyTypeEnum1669778297643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "for" TYPE text`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "for" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "for" SET DEFAULT 'GENERIC'`,
    )
    const existingApiKeyForEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'api_key_for_enum'",
    )
    const existingApiKeyTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'api_key_type_enum'",
    )
    if (existingApiKeyForEnum) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."api_key_for_enum"`)
    }
    if (existingApiKeyTypeEnum) {
      await queryRunner.query(
        `DROP TYPE IF EXISTS "public"."api_key_type_enum"`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existingApiKeyTypeEnum = await queryRunner.query(
      "SELECT 1 FROM pg_type WHERE typname = 'api_key_type_enum'",
    )
    if (!existingApiKeyTypeEnum[0]) {
      await queryRunner.query(
        `CREATE TYPE "public"."api_key_type_enum" AS ENUM('GCP', 'AWS', 'GENERIC')`,
      )
    }
    await queryRunner.query(
      `ALTER TABLE "api_key" ALTER COLUMN "for" "public"."api_key_type_enum" NOT NULL DEFAULT 'GENERIC'`,
    )
  }
}
