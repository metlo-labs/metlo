import { Summary as SummaryResponse } from "@common/types"
import { ConnectionsService } from "services/connections"
import { MetloContext } from "types"
import { getAlertTypeAggCached, getTopAlertsCached } from "./alerts"
import { getTopEndpointsCached } from "./endpoints"
import { getPIIDataTypeCountCached } from "./piiData"
import { getCountsCached, getUsageStatsCached } from "./usageStats"

export const getSummaryData = async (
  ctx: MetloContext,
): Promise<SummaryResponse> => {
  const topEndpoints = await getTopEndpointsCached(ctx)
  const alertTypeCount = await getAlertTypeAggCached(ctx)
  const topAlerts = await getTopAlertsCached(ctx)
  const piiDataTypeCount = await getPIIDataTypeCountCached(ctx)
  const usageStats = await getUsageStatsCached(ctx)
  const counts = await getCountsCached(ctx)
  const numConnections = await ConnectionsService.getNumConnections()
  return {
    piiDataTypeCount: piiDataTypeCount as any,
    alertTypeCount: alertTypeCount as any,
    topAlerts,
    topEndpoints,
    usageStats,
    numConnections,
    ...counts,
  }
}
