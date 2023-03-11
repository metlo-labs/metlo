import { MigrationInterface, QueryRunner } from "typeorm"

export class removeTraceHash1678477672617 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "traceHash"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" DROP COLUMN IF EXISTS "lastSeen"`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ADD COLUMN IF NOT EXISTS "traceHash" jsonb NOT NULL DEFAULT '{}'`,
    )
  }
}
