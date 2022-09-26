import axios from "axios"
import { GetAttackParams } from "@common/types"
import { getAPIURL } from "~/constants"

interface GetAttacksResp {
  validLicense: boolean
  attacks: any[]
}

export const getAttacks = async (
  params: GetAttackParams,
): Promise<GetAttacksResp> => {
  const resp = await axios.get<GetAttacksResp>(`${getAPIURL()}/attacks`, {
    params,
  })
  return resp.data
}
