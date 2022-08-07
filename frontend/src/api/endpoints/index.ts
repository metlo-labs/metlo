import axios from "axios"
import { ApiEndpoint, ApiEndpointDetailed, GetEndpointParams } from "@common/types"
import { API_URL } from "../../constants"

export const getEndpoints = async (params: GetEndpointParams) => {
  try {
    const resp = await axios.get<[ApiEndpoint[], number]>(
      `${API_URL}/endpoints`,
      { params }
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching endpoints: ${err}`);
    return []
  }
}

export const getEndpoint = async (endpointId: string) => {
  try {
    const resp = await axios.get<ApiEndpointDetailed>(`${API_URL}/endpoint/${endpointId}`)
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching endpoint: ${err}`);
    return null
  }
}

export const getHosts = async () => {
  try {
    const resp = await axios.get<string[]>(`${API_URL}/endpoints/hosts`)
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching hosts: ${err}`);
    return [];
  }
}
