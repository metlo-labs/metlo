import { Alert, Connection, ApiEndpointDetailed } from "@common/types";
import {
  RestMethod,
  RiskScore,
  AlertType,
  ConnectionType,
} from "@common/enums";

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
    uuid: "6cc33ac4-5a05-4915-9d0a-738242ccf70d",
    apiEndpointUuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
    apiEndpoint: {
      uuid: "5239bcfe-bf24-40e6-b952-b9811210108e",
      host: "AWS Gateway 1",
      path: "/foo/bar/{test}",
      method: RestMethod.POST,
      riskScore: RiskScore.HIGH,
      firstDetected: new Date("2022-07-31T00:52:10.586"),
      lastActive: new Date("2022-07-31T00:52:10.586Z"),
      totalCalls: 1,
      openapiSpecName: "",
      owner: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date("2021-12-17T03:24:00"),
    updatedAt: new Date("2021-12-17T03:24:00"),
    type: AlertType.OPEN_API_SPEC_DIFF,
    riskScore: RiskScore.LOW,
    description: ["Field differs from Open API Spec."],
    resolutionMessage: null,
    resolved: false,
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
`;
