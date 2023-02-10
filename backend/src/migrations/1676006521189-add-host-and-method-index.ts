import { MigrationInterface, QueryRunner } from "typeorm"

export class addHostAndMethodIndex1676006521189 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "method_api_endpoint" ON "api_endpoint" ("method")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "host_api_endpoint" ON "api_endpoint" ("host")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "method_api_endpoint"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "host_api_endpoint"`)
  }
}
