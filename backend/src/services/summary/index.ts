import { Summary as SummaryResponse } from "@common/types"
import mlog from "logger"
import { ApiEndpoint } from "models"
import { createQB } from "services/database/utils"
import { MetloContext } from "types"
import { getAlertTypeAggCached, getTopAlertsCached } from "./alerts"
import { getTopEndpointsCached } from "./endpoints"
import { getPIIDataTypeCountCached } from "./piiData"
import { getCountsCached, getUsageStatsCached } from "./usageStats"

export const getSummaryData = async (
  ctx: MetloContext,
): Promise<SummaryResponse> => {
  const startTopEndpoints = performance.now()
  const topEndpoints = await getTopEndpointsCached(ctx)
  mlog.time("backend.get_top_endpoints", performance.now() - startTopEndpoints)

  const startAlertTypeCount = performance.now()
  const alertTypeCount = await getAlertTypeAggCached(ctx)
  mlog.time("backend.get_alert_type_count", performance.now() - startAlertTypeCount)

  const startTopAlerts = performance.now()
  const topAlerts = await getTopAlertsCached(ctx)
  mlog.time("backend.get_top_alerts", performance.now() - startTopAlerts)

  const startPiiDataTypeCount = performance.now()
  const piiDataTypeCount = await getPIIDataTypeCountCached(ctx)
  mlog.time("backend.get_pii_data_type_count", performance.now() - startPiiDataTypeCount)

  const startUsageStats = performance.now()
  const usageStats = await getUsageStatsCached(ctx)
  mlog.time("backend.get_usage_stats", performance.now() - startUsageStats)

  const startCounts = performance.now()
  const counts = await getCountsCached(ctx)
  mlog.time("backend.get_counts", performance.now() - startCounts)

  return {
    piiDataTypeCount: piiDataTypeCount as any,
    alertTypeCount: alertTypeCount as any,
    topAlerts,
    topEndpoints,
    usageStats,
    numConnections: 0,
    ...counts,
  }
}

export const getEndpointExists = async (
  ctx: MetloContext,
): Promise<boolean> => {
  const existingEndpoint = await createQB(ctx)
    .select(["uuid"])
    .from(ApiEndpoint, "endpoint")
    .limit(1)
    .getRawMany()
  if (existingEndpoint?.length > 0) {
    return true
  }
  return false
}
