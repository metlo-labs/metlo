import axios from "axios"
import { AppDataSource } from "data-source"
import { InstanceSettings } from "models"
import { getCounts } from "services/summary/usageStats"
import { MetloContext } from "types"

export const logAggregatedStats = async () => {
  const ctx: MetloContext = {}
  const settingRepository = AppDataSource.getRepository(InstanceSettings)
  const settingsLs = await settingRepository.find()
  if (settingsLs.length == 0) {
    console.log("No instance settings found...")
    return
  }
  const settings = settingsLs[0]
  const counts = await getCounts(ctx)
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
      },
    },
  })
}
