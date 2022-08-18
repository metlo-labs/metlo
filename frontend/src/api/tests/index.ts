import axios from "axios";
import { getAPIURL } from "~/constants";
import { Test } from "@common/testing/types";

export const runTest = async (test: Test) => {
  const resp = await axios.post<any>(`${getAPIURL()}/test/run`, {
    test,
  });
};


export const saveTest = async (test: Test, endpoint_uuid: string) => {
  const resp = await axios.post<any>(`${getAPIURL()}/test/save`, {
    test,
    endpointUuid: endpoint_uuid,
  });
};
