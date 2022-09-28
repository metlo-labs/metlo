import axios from "axios"
import { AttackResponse, GetAttackParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const getAttacks = async (
  params: GetAttackParams,
): Promise<AttackResponse> => {
  const resp = await axios.get<AttackResponse>(`${getAPIURL()}/attacks`, {
    params,
  })
  return resp.data
}
