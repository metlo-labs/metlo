import { MigrationInterface, QueryRunner } from "typeorm"

export class removeHostPrimaryKeyAuthenticationconfig1673465613593
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "authentication_config" ADD COLUMN IF NOT EXISTS "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" RENAME CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575" TO "PK_9b463ac4dad1b0cf46a6fad5575_old"`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PK_9b463ac4dad1b0cf46a6fad5575" ON "authentication_config" ("uuid")`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" DROP CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575_old"`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" ADD PRIMARY KEY USING INDEX "PK_9b463ac4dad1b0cf46a6fad5575"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "authentication_config" RENAME CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575" TO "PK_9b463ac4dad1b0cf46a6fad5575_old"`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "PK_9b463ac4dad1b0cf46a6fad5575" ON "authentication_config" ("host")`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" DROP CONSTRAINT "PK_9b463ac4dad1b0cf46a6fad5575_old"`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" ADD PRIMARY KEY USING INDEX "PK_9b463ac4dad1b0cf46a6fad5575"`,
    )
    await queryRunner.query(
      `ALTER TABLE "authentication_config" DROP COLUMN IF EXISTS "uuid"`,
    )
  }
}
