import { MigrationInterface, QueryRunner } from "typeorm"

export class userSetEndpointColumn1673073826153 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "userSet" boolean NOT NULL DEFAULT FALSE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "userSet"`,
    )
  }
}
