import { MigrationInterface, QueryRunner } from "typeorm"

export class hostsList1677073188312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "hosts" (
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "host" text NOT NULL,
        "isPublic" bool DEFAULT false,
        CONSTRAINT "PK_hosts" PRIMARY KEY ("uuid"), CONSTRAINT "unique_host_per_org" UNIQUE ("host")
      )`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "hosts_table_host_name_idx" ON "hosts" ("host")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hosts"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "hosts_table_host_name_idx"`)
  }
}
