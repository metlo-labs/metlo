import { AuthType, RiskScore, __DataClass_INTERNAL__ } from "@common/enums"
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
            minLength: 1,
          },
          authType: {
            type: "string",
            enum: Object.keys(AuthType).map(e => e.toLowerCase()),
          },
          headerKey: {
            type: "string",
            minLength: 1,
          },
          jwtUserPath: {
            type: "string",
            minLength: 1,
          },
          cookieName: {
            type: "string",
            minLength: 1,
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
      minProperties: 1,
      patternProperties: {
        "^.*$": {
          type: "object",
          minProperties: 1,
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
      minProperties: 1,
      patternProperties: {
        [patternName]: {
          type: "object",
          additionalProperties: false,
          properties: {
            severity: {
              enum: Object.keys(RiskScore),
            },
            patterns: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "string",
                format: "regex",
              },
            },
          },
          required: ["severity", "patterns"],
        },
      },
      additionalProperties: false,
    },
    disabledDataClass: {
      type: "array",
      items: {
        enum: Object.keys(__DataClass_INTERNAL__),
      },
    },
  },
  additionalProperties: false,
  definitions: {
    disable_paths_object: {
      type: "object",
      properties: {
        disable_paths: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: {
            type: "string",
            pattern: `^(req\\.query|req\\.body|req\\.headers|res\\.headers|res\\.body)\\..+$`,
          },
        },
      },
      required: ["disable_paths"],
      additionalProperties: false,
    },
  },
} as Schema
