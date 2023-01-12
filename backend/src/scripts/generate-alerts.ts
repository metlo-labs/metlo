import mlog from "logger"
import yargs from "yargs"
import { AlertType } from "@common/enums"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import { AppDataSource } from "data-source"
import { Alert } from "models"
import { DatabaseService } from "services/database"
import { MetloContext } from "types"

const generateAlert = async (
  ctx: MetloContext,
  alertType: string,
  apiEndpointUuid: string,
  description: string,
  context: any,
) => {
  try {
    const newAlert = new Alert()
    newAlert.apiEndpointUuid = apiEndpointUuid
    newAlert.type = AlertType[alertType]
    newAlert.description = description
    newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[AlertType[alertType]]
    newAlert.context = JSON.parse(context || "{}")
    await DatabaseService.executeTransactions(ctx, [[newAlert]], [], false)
  } catch (err) {
    mlog.withErr(err).error("Error generating new alert from script")
  }
}

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    mlog.error("Couldn't initialize datasource...")
    return
  }
  mlog.info("AppDataSource Initialized...")
  const args = yargs.argv
  const alertType = args["alertType"]
  const apiEndpointUuid = args["endpointUuid"]
  const description = args["description"]
  const context = args["context"]
  await generateAlert({}, alertType, apiEndpointUuid, description, context)
}

main()
