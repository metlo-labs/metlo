import { MigrationInterface, QueryRunner } from "typeorm"

export class endpointGraphqlColumns1677479141637 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "graphQlSchema" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "graphQlMetadata" JSONB NOT NULL DEFAULT '{}'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "graphQlMetadata"`,
    )
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "graphQlSchema"`,
    )
  }
}
