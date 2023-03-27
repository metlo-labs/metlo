import { MigrationInterface, QueryRunner } from "typeorm"

export class dropBlockFieldAuthenticationTables1679774815747
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "authentication_config"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "block_fields"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "connections"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "authentication_config" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "host" character varying NOT NULL, "authType" "public"."auth_type_enum" NOT NULL, "headerKey" character varying, "jwtUserPath" character varying, "cookieName" character varying, CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "block_fields" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "pathRegex" character varying NOT NULL, "method" "public"."disable_rest_method_enum" NOT NULL, "host" character varying NOT NULL, "numberParams" integer NOT NULL DEFAULT '0', "disabledPaths" jsonb, CONSTRAINT "PK_af4435534e7494a34ce5330fba7" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "connections" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "connectionType" "public"."connection_type_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "aws" jsonb, "aws_meta" jsonb, "gcp" jsonb, "gcp_meta" jsonb, CONSTRAINT "PK_fd0e765308bb2b80af73ba85de6" PRIMARY KEY ("uuid"))`,
    )
  }
}
