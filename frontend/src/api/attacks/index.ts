import axios from "axios"
import {
  AttackDetailResponse,
  AttackResponse,
  GetAttackParams,
} from "@common/types"
import { getAPIURL } from "~/constants"

export const getAttacks = async (
  params: GetAttackParams,
): Promise<AttackResponse> => {
  const resp = await axios.get<AttackResponse>(`${getAPIURL()}/attacks`, {
    params,
  })
  return resp.data
}

export const getAttack = async (
  attackId: string,
): Promise<AttackDetailResponse> => {
  const resp = await axios.get<AttackDetailResponse>(
    `${getAPIURL()}/attack/${attackId}`,
  )
  return resp.data
}
