import axios from "axios"
import { PIIField, UpdatePIIFieldParams } from "@common/types"
import { getAPIURL } from "../../constants"

export const updatePiiField = async (piiFieldId: string, params: UpdatePIIFieldParams): Promise<PIIField> => {
  try {
    const resp = await axios.put<PIIField>(
      `${getAPIURL()}/data-class/${piiFieldId}`,
      { params }
    )
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return null;
  } catch (err) {
    console.error(`Error updating PII Field: ${err}`);
    return null;
  }
}
