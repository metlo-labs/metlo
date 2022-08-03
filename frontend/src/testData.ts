import { Endpoint } from "./types";
import { RiskScore } from "../../common/dist/enums";

export const testEndpoints: Endpoint[] = [
  {
    uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    environment: "production",
    host: "AWS Gateway 1",
    path: "/foo/bar/{test}",
    method: "POST",
    riskScore: RiskScore.HIGH,
    firstDetected: "2022-07-31T00:52:10.586",
    lastActive: "2022-07-31T00:52:10.586Z",
    piiData: [
      {
        dataType: "asdf",
        dataPath: "result.asdf",
        risk: RiskScore.HIGH,
        dateIdentified: "2022-07-31T00:52:10.586Z",
      },
      {
        dataType: "foo",
        dataPath: "result.asdf.asdf",
        risk: RiskScore.MEDIUM,
        dateIdentified: "2022-07-31T00:52:10.586Z",
      },
      {
        dataType: "bar",
        dataPath: "result.asdf.bar",
        risk: RiskScore.LOW,
        dateIdentified: "2022-07-31T00:52:10.586Z",
      },
    ],
    traces: [],
  },
  {
    uuid: "3425c51f-179b-45b6-9c1c-938f7f678f17",
    environment: "production",
    host: "AWS Gateway 1",
    path: "/foo/blam/{test}",
    method: "GET",
    riskScore: RiskScore.MEDIUM,
    firstDetected: "2022-07-31T00:52:10.586Z",
    lastActive: "2022-07-31T00:52:10.586Z",
    piiData: [],
    traces: [],
  },
];
