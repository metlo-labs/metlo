import { MigrationInterface, QueryRunner } from "typeorm"

export class metloConfigEnv1673503553138 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "env" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "envTag" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "envIV" text`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("metlo_config", "env")
    await queryRunner.dropColumn("metlo_config", "envIV")
    await queryRunner.dropColumn("metlo_config", "envTag")
  }
}
