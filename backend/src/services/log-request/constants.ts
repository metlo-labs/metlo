import { RestMethod } from "@common/enums"

export const TRACE_SCHEMA = {
  type: "object",
  properties: {
    request: {
      type: "object",
      properties: {
        url: {
          type: "object",
          properties: {
            host: {
              type: "string",
            },
            path: {
              type: "string",
            },
            parameters: {
              $ref: "#/definitions/pair_object_array",
            },
          },
          required: ["host", "path", "parameters"],
          additionalProperties: false,
        },
        headers: {
          $ref: "#/definitions/pair_object_array",
        },
        body: {
          type: "string",
        },
        method: {
          type: "string",
          enum: Object.keys(RestMethod),
        },
      },
      required: ["url", "headers", "method"],
      additionalProperties: false,
    },
    response: {
      type: "object",
      properties: {
        status: {
          type: "integer",
        },
        headers: {
          $ref: "#/definitions/pair_object_array",
        },
        body: {
          type: "string",
        },
      },
      required: ["status", "headers"],
      additionalProperties: false,
    },
    meta: {
      type: "object",
      properties: {
        incoming: {
          type: "boolean",
        },
        source: {
          type: "string",
        },
        sourcePort: {
          type: "string",
        },
        destination: {
          type: "string",
        },
        destinationPort: {
          type: "string",
        },
        environment: {
          type: "string",
        },
      },
      required: [
        "incoming",
        "source",
        "sourcePort",
        "destination",
        "destinationPort",
        "environment",
      ],
      additionalProperties: false,
    },
  },
  required: ["request", "response", "meta"],
  additionalProperties: false,
  definitions: {
    pair_object_array: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          value: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
}
