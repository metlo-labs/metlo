import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class customDataClasses1671813043343 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "dataClasses" TYPE TEXT array`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "falsePositives" TYPE TEXT array`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "scannerIdentified" TYPE TEXT array`,
    )

    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "dataClasses" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "falsePositives" DROP DEFAULT`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "scannerIdentified" DROP DEFAULT`,
    )

    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "dataClasses" SET DEFAULT '{}'`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "falsePositives" SET DEFAULT '{}'`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "scannerIdentified" SET DEFAULT '{}'`,
    )

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."data_class_enum"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."data_class_enum" AS ENUM('Email', 'Credit Card Number', 'Social Security Number', 'Phone Number', 'IP Address', 'Geographic Coordinates', 'Vehicle Identification Number', 'Address', 'Date of Birth', 'Driver License Number')`,
    )
    await queryRunner.query(
      `CREATE CAST (TEXT AS "public"."data_class_enum") WITH inout AS IMPLICIT`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "scannerIdentified" TYPE "public"."data_class_enum" array USING CAST("scannerIdentified" AS "public"."data_class_enum"[])`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "falsePositives" TYPE "public"."data_class_enum" array USING CAST("falsePositives" AS "public"."data_class_enum"[])`,
    )
    await queryRunner.query(
      `ALTER TABLE "data_field" ALTER COLUMN "dataClasses" TYPE "public"."data_class_enum" array USING CAST("dataClasses" AS "public"."data_class_enum"[])`,
    )
    await queryRunner.query(`DROP CAST (TEXT AS "public"."data_class_enum")`)
  }
}
