import axios from "axios";
import { SummaryResponse } from "@common/types";
import { API_URL } from "../../constants";

export const getSummary = async () => {
  const resp = await axios.get<SummaryResponse>(`${API_URL}/summary`);
  return resp.data;
};
