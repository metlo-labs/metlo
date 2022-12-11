import { MigrationInterface, QueryRunner } from "typeorm"

export class addEndpointIps1670653006577 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE api_endpoint ADD COLUMN IF NOT EXISTS "hostIps" JSONB NOT NULL DEFAULT '{}'`,
    )
    await queryRunner.query(
      `ALTER TABLE api_endpoint ADD COLUMN IF NOT EXISTS "srcIps" JSONB NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE api_endpoint DROP COLUMN "hostIps"`)
    await queryRunner.query(`ALTER TABLE api_endpoint DROP COLUMN "srcIps"`)
  }
}
