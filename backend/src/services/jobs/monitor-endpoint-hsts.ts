import mlog from "logger"
import axios from "axios"
import { ApiEndpoint, ApiTrace, Alert } from "models"
import { MetloContext } from "types"
import { getRepoQB, getRepository } from "services/database/utils"
import { createMissingHSTSAlert } from "services/alert/hsts"

const monitorEndpointForHSTS = async (ctx: MetloContext): Promise<void> => {
  try {
    const apiTraceRepository = getRepository(ctx, ApiTrace)
    const alertsRepository = getRepository(ctx, Alert)

    const alertableData: Array<[ApiEndpoint, ApiTrace, string]> = []

    for (const endpoint of await getRepoQB(ctx, ApiEndpoint).getMany()) {
      const latest_trace_for_endpoint = await apiTraceRepository.findOne({
        where: { apiEndpointUuid: endpoint.uuid },
        order: { createdAt: "DESC" },
      })
      if (
        latest_trace_for_endpoint &&
        !latest_trace_for_endpoint?.responseHeaders.find(v =>
          v.name.includes("Strict-Transport-Security"),
        )
      ) {
        try {
          let options_req = await axios.options(
            new URL(
              `http://${latest_trace_for_endpoint.host}${latest_trace_for_endpoint.path}`,
            ).href,
            {
              validateStatus: code => true,
            },
          )
          if (
            !Object.keys(options_req.headers).includes(
              "Strict-Transport-Security",
            )
          ) {
            alertableData.push([
              endpoint,
              latest_trace_for_endpoint,
              `Found endpoint possibly missing SSL on ${endpoint.path}`,
            ])
          }
        } catch (err) {
          mlog.log(
            `Couldn't perform OPTIONS request for endpoint ${endpoint.host}${endpoint.path}: ${err.message}`,
          )
        }
      }
    }
    let alerts = await createMissingHSTSAlert(ctx, alertableData)
    await alertsRepository.save(alerts)
  } catch (err) {
    mlog.error(
      `Encountered error while looking for HSTS enabled endpoints : ${err}`,
    )
  }
}

export default monitorEndpointForHSTS
