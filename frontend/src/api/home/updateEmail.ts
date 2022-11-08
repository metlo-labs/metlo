import axios, { AxiosRequestHeaders } from "axios"
import { getAPIURL } from "~/constants"

export const updateEmail = async (
  email: string,
  skip: boolean,
  headers?: AxiosRequestHeaders,
): Promise<void> => {
  return axios.put(
    `${getAPIURL()}/instance-settings`,
    { email, skip },
    { headers },
  )
}
