import { MigrationInterface, QueryRunner } from "typeorm"

export class addApiEndpointUuidIndexForAlert1667259254414
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "apiEndpointUuid_alert" ON "alert" ("apiEndpointUuid")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "apiEndpointUuid_alert"`)
  }
}
