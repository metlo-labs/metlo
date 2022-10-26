import { MigrationInterface, QueryRunner } from "typeorm"

export class dropAnalyzedColumnFromApiTrace1666752646836
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "api_trace" DROP COLUMN "analyzed"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_trace" ADD COLUMN "analyzed" BOOLEAN NOT NULL DEFAULT FALSE`,
    )
  }
}
