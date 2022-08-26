import axios from "axios";
import {
  DataField,
  IgnoreDataClassParams,
  UpdateDataFieldParams,
} from "@common/types";
import { getAPIURL } from "~/constants";

export const ignoreDataClass = async (
  fieldId: string,
  params: IgnoreDataClassParams
): Promise<DataField> => {
  try {
    const resp = await axios.put<DataField>(
      `${getAPIURL()}/data-field/${fieldId}/ignore`,
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
