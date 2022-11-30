import axios, { AxiosRequestHeaders } from "axios"
import { ApiKey } from "@common/types"
import { getAPIURL } from "~/constants"

export const getKeys = async (
  headers?: AxiosRequestHeaders,
): Promise<Array<ApiKey>> => {
  try {
    const resp = await axios.get<Array<ApiKey>>(`${getAPIURL()}/keys/list`, {
      headers,
    })
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
  } catch (err) {
    console.error(`Error fetching Api Keys: ${err}`)
    throw err
  }
}
export const deleteKey = async (
  key_name: string,
  headers?: AxiosRequestHeaders,
): Promise<void> => {
  try {
    const resp = await axios.delete(
      `${getAPIURL()}/keys/${encodeURIComponent(key_name)}/delete`,
      {
        headers,
      },
    )
    if (resp.status === 200 && resp.data) {
      return
    } else {
      throw Error(
        `Invalid response for deleting API Key ${key_name}.
                Received status ${resp.status} and response ${resp.data}`,
      )
    }
  } catch (err) {
    console.error(`Error deleting Api Key: ${err}`)
    throw err
  }
}
export const addKey = async (
  key_name: string,
  headers?: AxiosRequestHeaders,
): Promise<ApiKey & { apiKey: string }> => {
  try {
    const resp = await axios.post<ApiKey & { apiKey: string }>(
      `${getAPIURL()}/keys/create`,
      {
        name: key_name,
      },
      { headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    } else {
      throw Error(
        `Invalid response for adding API Key ${key_name}.
                Received status ${resp.status} and response ${resp.data}`,
      )
    }
  } catch (err) {
    console.error(`Error adding Api Key: ${err}`)
    throw err
  }
}
