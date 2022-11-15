import {
  DeleteTrafficMirrorFilterCommand,
  DeleteTrafficMirrorSessionCommand,
} from "@aws-sdk/client-ec2"
import chalk from "chalk"
import { prompt } from "enquirer"
import { getRegion } from "./cliUtils"
import { getEC2Client } from "./ec2Utils"
import {
  getMetloMirrorSessions,
  printMetloMirrorSessions,
} from "./sessionUtils"

export const awsTrafficMirrorRemove = async () => {
  try {
    const region = await getRegion()
    const trafficMirrorSessions = await getMetloMirrorSessions(region)
    if (trafficMirrorSessions.length == 0) {
      console.log(chalk.red.bold("\nNo active mirroring sessions..."))
      return
    }
    printMetloMirrorSessions(region, trafficMirrorSessions)
    console.log("")
    const removeResp = await prompt([
      {
        type: "select",
        name: "remove",
        message: "Select the session you want to remove",
        choices: trafficMirrorSessions.map(e => ({
          name: e.sessionID,
        })),
      },
    ])
    const removeSessionID = removeResp["remove"] as string
    const removeSession = trafficMirrorSessions.find(
      e => e.sessionID == removeSessionID,
    )
    const removeFilterID = removeSession.filterID
    const client = getEC2Client(region)
    await client.send(
      new DeleteTrafficMirrorSessionCommand({
        TrafficMirrorSessionId: removeSessionID,
      }),
    )
    await client.send(
      new DeleteTrafficMirrorFilterCommand({
        TrafficMirrorFilterId: removeFilterID,
      }),
    )
    client.destroy()
    console.log(chalk.green.bold(`\nDeleted Session ${removeSessionID}.`))
  } catch (e) {
    console.error(e)
  }
}
