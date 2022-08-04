import { Connection, Endpoint } from "@common/types";
import {
  RestMethod,
  RiskScore,
  AlertType,
  ConnectionType,
} from "@common/enums";

export const testEndpoints: Endpoint[] = [
  {
    uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    environment: "production",
    host: "AWS Gateway 1",
    path: "/foo/bar/{test}",
    method: RestMethod.POST,
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
    traces: [
      {
        uuid: "873b097d-0b93-4877-983d-86c4ec0295c7'",
        path: "foo/bar/1",
        createdAt: new Date("2021-12-17T03:24:00"),
        host: "test-api.metlo.com",
        method: RestMethod.POST,
        requestParameters: [
          {
            name: "testParam",
            value: "baz",
          },
        ],
        requestHeaders: [
          {
            name: "authToken",
            value: "awefiahwofgi23aw",
          },
        ],
        requestBody: "asdf",
        responseStatus: 200,
        responseHeaders: [],
        responseBody: "bar",
        meta: {
          incoming: true,
          source: "73.162.113.176",
          sourcePort: "7123",
          destination: "73.162.113.200",
          destinationPort: "80",
        },
        apiEndpointUuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
      },
    ],
    alerts: [
      {
        apiEndpointUuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
        createdAt: new Date("2021-12-17T03:24:00"),
        type: AlertType.OPEN_API_SPEC_DIFF,
        risk: RiskScore.LOW,
        description: "Field differs from Open API Spec.",
      },
    ],
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
    alerts: [],
  },
];

export const testConnections: Connection[] = [
  {
    createdAt: new Date("2021-12-17T03:24:00"),
    uuid: "72b29da8-8e15-4e5a-a152-05e886ee8eb4",
    name: "Metlo Test AWS",
    type: ConnectionType.AWS,
  },
  {
    createdAt: new Date("2021-12-17T03:24:00"),
    uuid: "c63048c4-98a5-44b0-a0b6-cffc1f630a31",
    name: "Metlo Test GCP",
    type: ConnectionType.GCP,
  },
];
