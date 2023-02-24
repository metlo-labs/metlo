import { AppDataSource } from "data-source"
import { Hosts, ApiEndpoint } from "models"
import { getQB, insertValuesBuilder } from "services/database/utils"
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
    const vals = await Promise.all(
      hosts.map(async ({ host }) => {
        let isPublic = false
        try {
          const resp = await axios.get(`http://${host}`, { timeout: 5000 })
          if (resp && resp.status) {
            isPublic = true
          }
        } catch (err) {
          if (err.code == "ERR_TLS_CERT_ALTNAME_INVALID") {
            isPublic = true
          }
        }
        return { isPublic, host }
      }),
    )
    await insertValuesBuilder(ctx, queryRunner, Hosts, vals)
      .orUpdate(["isPublic", "host"], ["host"])
      .execute()
  } catch (err) {
    mlog.withErr(err).log("Caught an error write private/public hosts")
    return false
  } finally {
    await queryRunner.release()
  }

  return true
}
