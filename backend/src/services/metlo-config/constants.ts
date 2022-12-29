import { AuthType, RiskScore } from "@common/enums"
import { Schema } from "ajv"

const patternName = String.raw`^[- \w]+$`

export const METLO_CONFIG_SCHEMA = {
  type: "object",
  properties: {
    authentication: {
      type: "array",
      items: {
        type: "object",
        properties: {
          host: {
            type: "string",
          },
          authType: {
            type: "string",
            enum: Object.keys(AuthType).map(e => e.toLowerCase()),
          },
          headerKey: {
            type: "string",
          },
          jwtUserPath: {
            type: "string",
          },
          cookieName: {
            type: "string",
          },
        },
        required: ["host", "authType"],
        allOf: [
          {
            if: {
              properties: {
                authType: { const: AuthType.HEADER.toLowerCase() },
              },
            },
            then: {
              required: ["host", "authType", "headerKey"],
            },
          },
          {
            if: {
              properties: { authType: { const: AuthType.JWT.toLowerCase() } },
            },
            then: {
              required: ["host", "authType", "headerKey"],
            },
          },
          {
            if: {
              properties: {
                authType: { const: AuthType.SESSION_COOKIE.toLowerCase() },
              },
            },
            then: {
              required: ["host", "authType", "cookieName"],
            },
          },
        ],
        additionalProperties: false,
      },
    },
    blockFields: {
      type: "object",
      patternProperties: {
        "^.*$": {
          type: "object",
          patternProperties: {
            "^ALL$": {
              $ref: "#/definitions/disable_paths_object",
            },
            "^(?!ALL).*$": {
              type: "object",
              properties: {
                GET: {
                  $ref: "#/definitions/disable_paths_object",
                },
                HEAD: {
                  $ref: "#/definitions/disable_paths_object",
                },
                POST: {
                  $ref: "#/definitions/disable_paths_object",
                },
                PUT: {
                  $ref: "#/definitions/disable_paths_object",
                },
                PATCH: {
                  $ref: "#/definitions/disable_paths_object",
                },
                DELETE: {
                  $ref: "#/definitions/disable_paths_object",
                },
                CONNECT: {
                  $ref: "#/definitions/disable_paths_object",
                },
                OPTIONS: {
                  $ref: "#/definitions/disable_paths_object",
                },
                TRACE: {
                  $ref: "#/definitions/disable_paths_object",
                },
                ALL: {
                  $ref: "#/definitions/disable_paths_object",
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
    },
    sensitiveData: {
      type: "object",
      patternProperties: {
        [patternName]: {
          type: "object",
          additionalProperties: false,
          properties: {
            "severity": {
              enum: Object.keys(RiskScore)
            },
            "patterns": {
              type: "array",
              uniqueItems: true,
              items: {
                type: "string",
                format: "regex"
              }
            }
          },
          required: ["severity", "patterns"]
        }
      },
      additionalProperties: false,
    }
  },
  additionalProperties: false,
  definitions: {
    disable_paths_object: {
      type: "object",
      properties: {
        disable_paths: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["disable_paths"],
      additionalProperties: false,
    },
  },
} as Schema
