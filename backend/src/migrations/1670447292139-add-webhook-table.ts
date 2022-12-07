import { MigrationInterface, QueryRunner } from "typeorm"

export class addWebhookTable1670447292139 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "webhook" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "maxRetries" integer NOT NULL DEFAULT '4', "alertTypes" character varying array NOT NULL DEFAULT '{}', "errors" character varying array NOT NULL DEFAULT '{}', CONSTRAINT "PK_bb57c3c8886ef87304032c70af35b765" PRIMARY KEY ("uuid"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook"`)
  }
}
