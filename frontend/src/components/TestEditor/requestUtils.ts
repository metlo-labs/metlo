import { Request } from "@common/testing/types";
import { RequestBodyType } from "@common/testing/enums";
import { ApiEndpoint } from "@common/types";
import axios, { AxiosRequestConfig } from "axios";
import { RestMethod } from "@common/enums";

export const sendRequest = (r: Request) => {
  console.log(r);
  let requestConfig: AxiosRequestConfig = {};
  requestConfig.url = r.url;
  requestConfig.method = r.method;
  requestConfig.params = Object.fromEntries(
    r.params.map((e) => [e.key, e.value])
  );
  requestConfig.headers = Object.fromEntries(
    r.headers.map((e) => [e.key, e.value])
  );
  requestConfig.data = r.body.data;
  return axios.request(requestConfig);
};

export const makeNewRequest = (parsedEndpoint: ApiEndpoint) => ({
  method: parsedEndpoint.method,
  url: `http://${parsedEndpoint.host}${parsedEndpoint.path}`,
  params: [],
  headers: [],
  body: {
    type: RequestBodyType.NONE,
    data: null,
  },
  tests: "",
});

export const makeNewEmptyRequest = (parsedEndpoint: ApiEndpoint) => ({
  method: RestMethod.GET,
  url: `http://${parsedEndpoint.host}`,
  params: [],
  headers: [],
  body: {
    type: RequestBodyType.NONE,
    data: null,
  },
  tests: "",
});
