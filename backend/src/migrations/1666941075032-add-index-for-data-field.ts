import { MigrationInterface, QueryRunner } from "typeorm"

export class addIndexForDataField1666941075032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "apiEndpointUuid_data_field" ON "data_field" ("apiEndpointUuid")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "apiEndpointUuid_data_field"`)
  }
}
