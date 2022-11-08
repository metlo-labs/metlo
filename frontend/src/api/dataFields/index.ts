import axios, { Axios, AxiosRequestHeaders } from "axios"
import { DataField, UpdateDataFieldClassesParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const updateDataFieldClasses = async (
  fieldId: string,
  params: UpdateDataFieldClassesParams,
  headers?: AxiosRequestHeaders,
): Promise<DataField> => {
  const resp = await axios.post<DataField>(
    `${getAPIURL()}/data-field/${fieldId}/update-classes`,
    { ...params },
    { headers },
  )
  return resp.data
}

export const deleteDataField = async (
  fieldId: string,
  headers?: AxiosRequestHeaders,
): Promise<DataField> => {
  const resp = await axios.delete<DataField>(
    `${getAPIURL()}/data-field/${fieldId}`,
    { headers },
  )
  return resp.data
}
