import axios from "axios";
import { SummaryResponse } from "@common/types";
import { getAPIURL } from "../../constants";

export const getSummary = async () => {
  const resp = await axios.get<SummaryResponse>(`${getAPIURL()}/summary`);
  return resp.data;
};
