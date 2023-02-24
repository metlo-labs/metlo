import { AppDataSource } from "data-source"
import { Hosts, ApiEndpoint } from "models"
import { getQB, insertValuesBuilder } from "services/database/utils"
import { MetloContext } from "types"
import axios from "axios"
import mlog from "logger"
import { chunk } from "lodash"
import { HOST_TEST_CHUNK_SIZE } from "~/constants"

const detectLocal = async (hosts: string[]) => {
  return await Promise.all(
    chunk(hosts, HOST_TEST_CHUNK_SIZE).flatMap(host_chunk =>
      host_chunk.map(async host => {
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
    ),
  )
}

const detectProxy = async (hosts: string[]) => {
  return (
    await axios.post<{ isPublic: boolean; host: string }[]>(
      `${process.env.HTTP_TEST_PROXY_URL}/api/v1/check-public-host`,
      { checkHosts: hosts },
    )
  ).data
}

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
    const detectFunc = process.env.HTTP_TEST_PROXY_URL
      ? detectProxy
      : detectLocal
    const vals = await detectFunc(hosts.map(e => e.host))
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
