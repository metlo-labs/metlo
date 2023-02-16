import Ajv from "ajv"
import formatsPlugin from "ajv-formats"

const ENTITY_FIELD_PATTERN = String.raw`^[-_\w]+$`
const ENTITY_PATTERN = String.raw`^[-_\w]+$`
const RESOURCE_PATTERN = String.raw`^[-_\w]+$`

const ajv = new Ajv()
formatsPlugin(ajv)

export const TESTING_CONFIG_SCHEMA = {
  type: "object",
  properties: {
    entities: {
      type: "object",
      patternProperties: {
        [ENTITY_PATTERN]: {
          type: "array",
          items: {
            type: "object",
            patternProperties: {
              [ENTITY_FIELD_PATTERN]: {
                anyOf: [
                  {
                    type: "string",
                    minLength: 1,
                  },
                  {
                    type: "number",
                  },
                  {
                    type: "boolean",
                  },
                ],
              },
            },
            minProperties: 1,
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    resources: {
      type: "object",
      patternProperties: {
        [RESOURCE_PATTERN]: {
          type: "object",
          required: ["permissions"],
          properties: {
            permissions: {
              type: "array",
              items: {
                type: "string",
                enum: ["read", "write", "all"],
              },
              minItems: 1,
              uniqueItems: true,
            },
          },
          additionalProperties: false,
        },
      },
    },
    assignments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          entity: {
            type: "object",
            additionalProperties: false,
            required: ["name"],
            properties: {
              name: { type: "string" },
              fields: {
                type: "object",
                patternProperties: {
                  [ENTITY_FIELD_PATTERN]: {
                    type: "array",
                    items: {
                      anyOf: [
                        {
                          type: "string",
                          minLength: 1,
                        },
                        {
                          type: "number",
                        },
                        {
                          type: "boolean",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  additionalProperties: false,
}

export const validateSchema = ajv.compile(TESTING_CONFIG_SCHEMA)
