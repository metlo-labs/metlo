import { prompt } from "enquirer"
import { AWS_REGIONS } from "./constants"

export const getRegion = async () => {
  const regionResp = await prompt([
    {
      type: "select",
      name: "_region",
      message: "Select your AWS region",
      initial: 1,
      choices: AWS_REGIONS.map(e => ({
        name: e,
      })),
    },
  ])
  return regionResp["_region"] as string
}
