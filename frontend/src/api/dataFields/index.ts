import axios from "axios"
import { DataField, UpdateDataFieldClassesParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const updateDataFieldClasses = async (
  fieldId: string,
  params: UpdateDataFieldClassesParams,
): Promise<DataField> => {
  const resp = await axios.post<DataField>(
    `${getAPIURL()}/data-field/${fieldId}/update-classes`,
    { ...params },
  )
  return resp.data
}

export const deleteDataField = async (fieldId: string): Promise<DataField> => {
  try {
    const resp = await axios.delete<DataField>(
      `${getAPIURL()}/data-field/${fieldId}`,
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    return null
  }
}
