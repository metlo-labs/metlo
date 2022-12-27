import { AppDataSource } from "data-source"
import { ApiEndpoint } from "models"
import { getQB } from "services/database/utils"
import { MetloContext } from "types"
import { RedisClient } from "utils/redis"
import { INTERNAL_IP_SET_KEY } from "./constants"

export const updateEndpointIps = async (ctx: MetloContext) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const hostIps: { hostIps: { [key: string]: number } }[] = await getQB(
      ctx,
      queryRunner,
    )
      .select(['"hostIps"'])
      .from(ApiEndpoint, "endpoint")
      .execute()
    await RedisClient.deleteKeyFromRedis(ctx, INTERNAL_IP_SET_KEY)
    await RedisClient.addValueToSet(ctx, INTERNAL_IP_SET_KEY, [
      ...new Set(hostIps.map(e => Object.keys(e.hostIps)).flat()),
    ])
  } catch {
  } finally {
    await queryRunner.release()
  }
}
