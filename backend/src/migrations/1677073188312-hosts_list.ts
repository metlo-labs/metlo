import axios from "axios"
import { ApiEndpoint, Hosts } from "models"
import { getEntityManager, getQB } from "services/database/utils"
import { MigrationInterface, QueryRunner } from "typeorm"

export class hostsList1677073188312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "hosts" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "host" text NOT NULL,"isPublic" bool DEFAULT false, CONSTRAINT "PK_hosts" PRIMARY KEY ("uuid"))`,
    )
    // TODO: Get organization here
    await Promise.all(
      (
        await getQB({}, queryRunner)
          .select(["host"])
          .from(ApiEndpoint, "endpoint")
          .distinct(true)
          .groupBy("host")
          .getRawMany()
      ).map(async ({ host }) => {
        let isPublic = false
        try {
          const resp = await axios.get(`http://${host}`)
          if (resp && resp.status) {
            isPublic = true
          }
        } catch (err) {
          // pass
        }
        try {
          const res = await getEntityManager({}, queryRunner).insert(Hosts, [
            { host, isPublic },
          ])
        } catch (err) {
          // pass
        }
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "hosts"`)
  }
}
