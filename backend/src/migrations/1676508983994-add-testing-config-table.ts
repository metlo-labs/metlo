import { MigrationInterface, QueryRunner } from "typeorm"

export class addTestingConfigTable1676508983994 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "testing_config" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "configString" character varying NOT NULL, CONSTRAINT "PK_testing_config" PRIMARY KEY ("uuid"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "entity" varchar`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "testing_config"`)
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "entity"`,
    )
  }
}
