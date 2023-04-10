import { MigrationInterface, QueryRunner } from "typeorm"

export class addGraphqlSchemaTable1681005220368 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" DROP COLUMN IF EXISTS "graphQlSchema"`,
    )
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "gql_schema" (
            "name" character varying NOT NULL,
            "schema" character varying NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            CONSTRAINT "PK_gql_schema" PRIMARY KEY ("name")
        )`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_endpoint" ADD COLUMN IF NOT EXISTS "graphQlSchema" character varying`,
    )
    await queryRunner.query(`DROP TABLE IF EXISTS "gql_schema"`)
  }
}
