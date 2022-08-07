import { Alert, Connection, Endpoint } from "@common/types";
import {
  RestMethod,
  RiskScore,
  AlertType,
  ConnectionType,
  DataClass,
} from "@common/enums";

export const testEndpoints: Endpoint[] = [
  {
    uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    host: "AWS Gateway 1",
    path: "/foo/bar/{test}",
    method: RestMethod.POST,
    riskScore: RiskScore.HIGH,
    firstDetected: "2022-07-31T00:52:10.586",
    lastActive: "2022-07-31T00:52:10.586Z",
    piiData: [
      {
        uuid: "62073e0e-7a46-4875-83b8-fd356cdaadaf",
        dataClass: DataClass.SSN,
        dataPath: "result.asdf",
        risk: RiskScore.HIGH,
        createdAt: "2022-07-31T00:52:10.586Z",
        updatedAt: "2022-07-31T00:52:10.586Z",
        matches: [],
        isRisk: true,
      },
      {
        uuid: "af226cd2-5fe6-4cf5-b55e-3bf6921d1e09",
        dataClass: DataClass.CREDIT_CARD,
        dataPath: "result.asdf.asdf",
        risk: RiskScore.MEDIUM,
        createdAt: "2022-07-31T00:52:10.586Z",
        updatedAt: "2022-07-31T00:52:10.586Z",
        matches: [],
        isRisk: true,
      },
      {
        uuid: "0bf054a6-6005-47e6-8d01-7ecb4c48be68",
        dataClass: DataClass.IP_ADDRESS,
        dataPath: "result.asdf.bar",
        risk: RiskScore.LOW,
        createdAt: "2022-07-31T00:52:10.586Z",
        updatedAt: "2022-07-31T00:52:10.586Z",
        matches: [],
        isRisk: true,
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

export const testAlerts: Alert[] = [
  {
    apiEndpointUuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    endpoint: {
      uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
      host: "AWS Gateway 1",
      path: "/foo/bar/{test}",
      method: RestMethod.POST,
      riskScore: RiskScore.HIGH,
      firstDetected: "2022-07-31T00:52:10.586",
      lastActive: "2022-07-31T00:52:10.586Z",
      piiData: [],
      traces: [],
      alerts: [],
    },
    createdAt: new Date("2021-12-17T03:24:00"),
    type: AlertType.OPEN_API_SPEC_DIFF,
    risk: RiskScore.LOW,
    description: "Field differs from Open API Spec.",
  },
];

export const openAPISpec = `openapi: 3.0.0
info:
  title: Sample API
  description: Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.
  version: 0.1.9
servers:
  - url: http://api.example.com/v1
    description: Optional server description, e.g. Main (production) server
  - url: http://staging-api.example.com
    description: Optional server description, e.g. Internal staging server for testing
paths:
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
  /foo:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
`
