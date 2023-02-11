import mlog from "logger"
import axios from "axios"
import { InstanceSettings } from "models"
import { getRepository } from "services/database/utils"
import { getCounts } from "services/summary/usageStats"
import { MetloContext } from "types"

export const logAggregatedStats = async (
  ctx: MetloContext,
): Promise<boolean> => {
  const settingRepository = getRepository(ctx, InstanceSettings)
  const settingsLs = await settingRepository.find()
  if (settingsLs.length == 0) {
    mlog.log("No instance settings found...")
    return
  }
  const settings = settingsLs[0]
  const counts = await getCounts(ctx)
  try {
    await axios({
      url: "https://logger.metlo.com/log",
      method: "POST",
      data: {
        instanceUUID: settings.uuid,
        eventName: "instanceAggregatedStats",
        data: {
          numEndpoints: counts.endpointsTracked,
          numHosts: counts.hostCount,
          openAlerts: counts.newAlerts,
          openHighRiskAlerts: counts.highRiskAlerts,
          piiDataFields: counts.piiDataFields,
          email: settings.updateEmail,
          skippedEmail: settings.skippedUpdateEmail,
          licenseKey: process.env.LICENSE_KEY,
        },
      },
    })
    return true
  } catch (err) {
    mlog.withErr(err).error("Encountered error while logging aggregated stats")
    return false
  }
}
