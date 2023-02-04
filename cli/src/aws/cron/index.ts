import { _awsTrafficMirrorSetup } from "../../aws/setup"
import { appendFileSync, existsSync, readFileSync } from "fs"
import { logger, stringToCSV } from "./utils"

export async function awsCheckMirroringSessionExistsJob(path) {
  try {
    if (existsSync(path)) {
      const csv_data = stringToCSV(readFileSync(path).toString())
      for (const data of csv_data) {
        try {
          await _awsTrafficMirrorSetup({
            id: data.uuid,
            target: data.target,
            source: data.source,
            region: data.region,
          })
        } catch (err) {
          logger("Could not create traffic mirroring session")
          if (err.message) {
            logger(`Encountered error: ${err.message}`)
          }
        }
      }
    }
  } catch (err) {
    logger(err)
  }
}
