import Ajv from "ajv"
import { TraceParams } from "@common/types"
import { TRACE_SCHEMA } from "./constants"

export const validateTraceParams = (
  traceParams: TraceParams,
): string | null => {
  const ajv = new Ajv()
  const validate = ajv.compile(TRACE_SCHEMA)
  const valid = validate(traceParams)
  if (!valid) {
    const errors = validate.errors
    if (errors) {
      const error = errors[0]
      let errorMessage = `${error.instancePath} ${error.message}`
      switch (error.keyword) {
        case "additionalProperties":
          const additionalProperty = error.params.additionalProperty
          errorMessage = `property '${additionalProperty}' is not expected to be in ${error.instancePath}`
          break
        case "enum":
          errorMessage = `${
            error.instancePath
          } must be equal to one of the allowed values: ${error.params.allowedValues?.join(
            ", ",
          )}`
          break
      }
      return errorMessage
    }
  }
  return null
}
