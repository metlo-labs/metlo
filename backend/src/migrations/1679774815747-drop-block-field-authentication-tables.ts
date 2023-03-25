import { MigrationInterface, QueryRunner } from "typeorm"

export class dropBlockFieldAuthenticationTables1679774815747
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "authentication_config"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "block_fields"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "authentication_config" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "host" character varying NOT NULL, "authType" "public"."auth_type_enum" NOT NULL, "headerKey" character varying, "jwtUserPath" character varying, "cookieName" character varying, CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "block_fields" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "pathRegex" character varying NOT NULL, "method" "public"."disable_rest_method_enum" NOT NULL, "host" character varying NOT NULL, "numberParams" integer NOT NULL DEFAULT '0', "disabledPaths" jsonb, CONSTRAINT "PK_af4435534e7494a34ce5330fba7" PRIMARY KEY ("uuid"))`,
    )
  }
}
