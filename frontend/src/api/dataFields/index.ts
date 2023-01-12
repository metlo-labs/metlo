import axios, { AxiosRequestHeaders } from "axios"
import { DataField } from "@common/types"
import { UpdateDataFieldClassesParams } from "@common/api/endpoint"
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

export const clearSensitiveData = async (
  headers?: AxiosRequestHeaders,
): Promise<DataField> => {
  const resp = await axios.post(`${getAPIURL()}/clear-sensitive-data`, {
    headers,
  })
  return resp.data
}
