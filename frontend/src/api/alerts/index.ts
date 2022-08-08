import axios from "axios";
import { GetAlertParams, Alert } from "@common/types";
import { API_URL } from "../../constants";

export const getAlerts = async (params: GetAlertParams): Promise<[Alert[], number]> => {
  try {
    const resp = await axios.get<[Alert[], number]>(
      `${API_URL}/alerts`,
      { params }
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [[], 0];
  } catch (err) {
    console.error(`Error fetching alerts: ${err}`);
    return [[], 0];
  }
}
