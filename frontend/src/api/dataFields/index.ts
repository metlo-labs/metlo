import axios from "axios";
import { DataField, UpdateDataFieldParams } from "@common/types";
import { getAPIURL } from "~/constants";

export const updateDataField = async (
  fieldId: string,
  params: UpdateDataFieldParams
): Promise<DataField> => {
  try {
    const resp = await axios.put<DataField>(
      `${getAPIURL()}/data-field/${fieldId}`,
      { ...params }
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return null;
  } catch (err) {
    console.error(`Error updating Data Field: ${err}`);
    return null;
  }
};
