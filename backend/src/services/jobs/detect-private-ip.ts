import { AppDataSource } from "data-source"
import { Hosts, ApiKey } from "models"
import { getEntityManager, getQB, getRepoQB } from "services/database/utils"
import { MetloContext } from "types"
import axios from "axios"

export const detectPrivateHosts = async (
  ctx: MetloContext,
): Promise<boolean> => {
  const hosts = await Hosts.find()
  await Promise.all(
    hosts.map(async host => {
      const queryrunner = AppDataSource.createQueryRunner()
      try {
        await queryrunner.connect()
        let isPublic = false
        try {
          const resp = await axios.get(`http://${host.host}`)
          if (resp && resp.status) {
            isPublic = true
          }
        } catch (err) {
          console.log(err)
        }
        await getEntityManager(ctx, queryrunner).update(
          Hosts,
          { uuid: host.uuid },
          { isPublic },
        )
      } catch (err) {
        console.log(err)
      } finally {
        await queryrunner.release()
      }
    }),
  )

  return true
}
