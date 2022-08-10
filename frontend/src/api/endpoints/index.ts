import axios from "axios"
import { ApiEndpoint, ApiEndpointDetailed, GetEndpointParams } from "@common/types"
import { getAPIURL } from "~/constants"

export const getEndpoints = async (params: GetEndpointParams): Promise<[ApiEndpoint[], number]> => {
  try {
    const resp = await axios.get<[ApiEndpoint[], number]>(
      `${getAPIURL()}/endpoints`,
      { params }
    );
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [[], 0];
  } catch (err) {
    console.error(`Error fetching endpoints: ${err}`);
    return [[], 0]
  }
}

export const getEndpoint = async (endpointId: string): Promise<ApiEndpointDetailed> => {
  try {
    const resp = await axios.get<ApiEndpointDetailed>(`${getAPIURL()}/endpoint/${endpointId}`)
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching endpoint: ${err}`);
    return null
  }
}

export const getHosts = async (): Promise<string[]> => {
  try {
    const resp = await axios.get<string[]>(`${getAPIURL()}/endpoints/hosts`)
    if (resp.status === 200 && resp.data) {
      return resp.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching hosts: ${err}`);
    return [];
  }
}
