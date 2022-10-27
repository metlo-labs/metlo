import { MigrationInterface, QueryRunner } from "typeorm"

export class addUniqueConstraintApiEndpoint1666678487137
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD CONSTRAINT "unique_constraint_api_endpoint" UNIQUE ("path", "method", "host")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP CONSTRAINT "unique_constraint_api_endpoint"`,
    )
  }
}
