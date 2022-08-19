import { Request } from "@common/testing/types";
import { RequestBodyType } from "@common/testing/enums";
import { ApiEndpoint } from "@common/types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
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
  axios.interceptors.request.use(
    function (config) {
      config.metadata = { startTime: new Date() };
      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    function (response) {
      response.config.metadata.endTime = new Date();
      response.duration =
        response.config.metadata.endTime - response.config.metadata.startTime;
      response.config.metadata.length = response.headers["content-length"];
      return response;
    },
    function (error: AxiosError) {
      error.response.config.metadata.endTime = new Date();
      error.response.duration =
        error.config.metadata.endTime - error.config.metadata.startTime;
      error.response.config.metadata.length =
        error.response.headers["content-length"];
      return Promise.reject(error);
    }
  );

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
