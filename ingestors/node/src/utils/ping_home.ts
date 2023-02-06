import axios from "axios"
import { Logger } from "./Logger"

const endpoint = "api/v1/verify"

export async function ping_home(host: string, apiKey: string) {
  const logger = Logger.getLogger()
  try {
    const resp = await axios.get(`${host}${endpoint}`, {
      headers: { Authorization: apiKey },
      timeout: 5000,
    })
    if (resp.status != 200) {
      logger.error(
        `Problem encountered while validating connection to Metlo.\nReceived error code ${resp.status}.`,
      )
      throw new Error()
    }
    return
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      logger.error("Connection to metlo timed out.")
      throw new Error()
    }
    if (!err.response) {
      logger.error("Encountered unknonwn error while initializing metlo.")
      throw new Error()
    }
    if (err.response.status == 404) {
      logger.error(
        `Metlo host at ${host} is unreachable.\nMetlo host may be incorrect or metlo version may be old`,
      )
      throw new Error()
    } else if (err.response.status == 401) {
      logger.error("Could not validate Metlo API key.")
      throw new Error()
    } else if (err.response.status != 200) {
      logger.error(
        `Problem encountered while validating connection to Metlo.\nReceived error code ${err.response.status}.`,
      )
      throw new Error()
    }
  }
}
