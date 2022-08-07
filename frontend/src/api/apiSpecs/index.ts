import axios from "axios";
import { OpenApiSpec } from "@common/types";
import { API_URL } from "../../constants";

export const getSpecs = async () => {
  try {
    const resp = await axios.get<[OpenApiSpec[], number]>(
      `${API_URL}/spec/list`
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching endpoints: ${err}`);
    return [];
  }
};
