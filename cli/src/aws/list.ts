import { getRegion } from "./cliUtils"
import {
  getMetloMirrorSessions,
  printMetloMirrorSessions,
} from "./sessionUtils"

export const awsTrafficMirrorList = async () => {
  try {
    const region = await getRegion()
    const trafficMirrorSessions = await getMetloMirrorSessions(region)
    printMetloMirrorSessions(region, trafficMirrorSessions)
  } catch (e) {
    console.error(e)
  }
}
