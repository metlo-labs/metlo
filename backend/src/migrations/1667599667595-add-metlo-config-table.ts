import { MigrationInterface, QueryRunner } from "typeorm"

export class addMetloConfigTable1667599667595 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "metlo_config" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "configString" character varying NOT NULL, CONSTRAINT "PK_af010f5deb8072a39d9aa13c89b" PRIMARY KEY ("uuid"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "metlo_config"`)
  }
}
