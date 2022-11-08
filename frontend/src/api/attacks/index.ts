import axios, { AxiosRequestHeaders } from "axios"
import {
  AttackDetailResponse,
  AttackResponse,
  GetAttackParams,
} from "@common/types"
import { getAPIURL } from "~/constants"

export const getAttacks = async (
  params: GetAttackParams,
  headers?: AxiosRequestHeaders,
): Promise<AttackResponse> => {
  const resp = await axios.get<AttackResponse>(`${getAPIURL()}/attacks`, {
    params,
    headers,
  })
  return resp.data
}

export const getAttack = async (
  attackId: string,
  headers?: AxiosRequestHeaders,
): Promise<AttackDetailResponse> => {
  const resp = await axios.get<AttackDetailResponse>(
    `${getAPIURL()}/attack/${attackId}`,
    { headers },
  )
  return resp.data
}

export const resolveAttack = async (
  attackId: string,
  headers?: AxiosRequestHeaders,
): Promise<void> => {
  await axios.put(`${getAPIURL()}/attack/${attackId}/resolve`, { headers })
}
