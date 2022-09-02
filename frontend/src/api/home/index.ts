import axios from "axios"
import { Summary } from "@common/types"
import { getAPIURL } from "~/constants"

export const getSummary = async (): Promise<Summary> => {
  try {
    const resp = await axios.get<Summary>(`${getAPIURL()}/summary`)
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    console.error(`Error fetching summary stats: ${err}`)
    return null
  }
}
