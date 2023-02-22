import { AppDataSource } from "data-source"
import { Hosts, ApiKey, ApiEndpoint } from "models"
import {
  createQB,
  getEntityManager,
  getQB,
  getRepoQB,
} from "services/database/utils"
import { MetloContext } from "types"
import axios from "axios"
import mlog from "logger"

export const detectPrivateHosts = async (
  ctx: MetloContext,
): Promise<boolean> => {
  let queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const hosts = await getQB(ctx, queryRunner)
      .select(["host"])
      .from(ApiEndpoint, "endpoint")
      .distinct(true)
      .groupBy("host")
      .getRawMany()
    await Promise.all(
      hosts.map(async ({ host }) => {
        const qr = AppDataSource.createQueryRunner()
        try {
          await qr.connect()
          let isPublic = false
          try {
            const resp = await axios.get(`http://${host}`)
            if (resp && resp.status) {
              isPublic = true
            }
          } catch (err) {
            if (err.code == "ERR_TLS_CERT_ALTNAME_INVALID") {
              isPublic = true
            }
          }
          await createQB(ctx)
            .insert()
            .into(Hosts, ["isPublic", "host"])
            .values([{ isPublic, host }])
            .orUpdate(["isPublic", "host"], ["host"], {})
            .execute()
        } catch (err) {
          console.log(err)
        } finally {
          await qr.release()
        }
      }),
    )
  } catch (err) {
    mlog.withErr(err).log("Caught an error detecting private/public IPs")
    throw err
  } finally {
    await queryRunner.release()
  }

  return true
}
