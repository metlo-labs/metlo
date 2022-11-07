import { MigrationInterface, QueryRunner } from "typeorm"

export class migrationsUser1667843036202 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const existingAuthTypeEnum = await queryRunner.query(
            "SELECT 1 FROM pg_type WHERE typname = 'logintype_enum'",
        )
        if (!existingAuthTypeEnum[0]) {
            await queryRunner.query(
                `CREATE TYPE "public"."logintype_enum" AS ENUM('github', 'google')`,
            )
        }
        await queryRunner.query(
            `create table if not exists "user" ("id" character varying not null, "userImage" character varying, "account" "public"."logintype_enum" not null, "name" character varying not null, "email" character varying, "meta" jsonb not null default '{}', "createdAt" TIMESTAMP with TIME zone not null default now(), "updatedAt" TIMESTAMP with TIME zone not null default now(), constraint "PK_P6ke75o6ygH5ly1ihOAFEybPiHkhA5Z2vykHIo5a" primary key ("id"))`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE "public"."auth_type_enum"`)
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "PK_P6ke75o6ygH5ly1ihOAFEybPiHkhA5Z2vykHIo5a"`)
        await queryRunner.query(`DROP TABLE "user"`)
    }

}
