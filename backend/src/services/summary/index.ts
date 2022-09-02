import { Summary as SummaryResponse } from "@common/types"
import { getAlertTypeAggCached, getTopAlertsCached } from "./alerts"
import { getTopEndpointsCached } from "./endpoints"
import { getPIIDataTypeCountCached } from "./piiData"
import { getCountsCached, getUsageStatsCached } from "./usageStats"

export class SummaryService {
  static async getSummaryData(): Promise<SummaryResponse> {
    const topEndpoints = await getTopEndpointsCached()
    const alertTypeCount = await getAlertTypeAggCached()
    const topAlerts = await getTopAlertsCached()
    const piiDataTypeCount = await getPIIDataTypeCountCached()
    const usageStats = await getUsageStatsCached()
    const counts = await getCountsCached()
    return {
      piiDataTypeCount: piiDataTypeCount as any,
      alertTypeCount: alertTypeCount as any,
      topAlerts,
      topEndpoints,
      usageStats,
      ...counts,
    }
  }
}
