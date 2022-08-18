import axios from "axios";
import { getAPIURL } from "~/constants";
import { Test } from "@common/testing/types";

export const runTest = async (test: Test) => {
  const resp = await axios.post<any>(`${getAPIURL()}/test/run`, {
    test,
  });
};
