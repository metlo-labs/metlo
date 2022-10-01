import axios from "axios"
import { getAPIURL } from "~/constants"

export const updateEmail = async (
  email: string,
  skip: boolean,
): Promise<void> => {
  return axios.put(`${getAPIURL()}/instance-settings`, { email, skip })
}
