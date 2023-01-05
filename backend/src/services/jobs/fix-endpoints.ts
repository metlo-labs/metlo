import { AppDataSource } from "data-source"
import { ApiEndpoint } from "models"
import { getQB } from "services/database/utils"
import {
  getTopSuggestedPaths,
  updatePaths,
} from "services/get-endpoints/path-heuristic"
import { MetloContext } from "types"

const MIN_NUM_TRACES = 1000

const fixEndpoints = async (ctx: MetloContext): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const endpoints: ApiEndpoint[] = await getQB(ctx, queryRunner)
      .select(["uuid"])
      .from(ApiEndpoint, "endpoint")
      .getRawMany()
    for (const endpoint of endpoints) {
      const topSuggestedPaths = await getTopSuggestedPaths(
        ctx,
        endpoint.uuid,
        MIN_NUM_TRACES,
      )
      if (topSuggestedPaths.length > 0 && topSuggestedPaths.length <= 10) {
        await updatePaths(ctx, topSuggestedPaths, endpoint.uuid, true)
      }
    }
  } catch (err) {
    console.error(`Encountered error while fixing endpoints: ${err}`)
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
  } finally {
    await queryRunner.release()
  }
}

export default fixEndpoints
