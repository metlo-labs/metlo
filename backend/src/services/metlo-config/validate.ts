import yaml from "js-yaml"
import Ajv from "ajv"
import formatsPlugin from "ajv-formats"
import SourceMap from "js-yaml-source-map"
import Error400BadRequest from "errors/error-400-bad-request"
import { METLO_CONFIG_SCHEMA } from "./constants"

export const validateMetloConfig = (configString: string) => {
  configString = configString.trim()
  let metloConfig: object = null
  const map = new SourceMap()
  try {
    metloConfig = yaml.load(configString, { listener: map.listen() }) as object
    metloConfig = metloConfig ?? {}
  } catch (err) {
    throw new Error400BadRequest("Config is not a valid yaml file")
  }
  const ajv = new Ajv()
  formatsPlugin(ajv)

  const validate = ajv.compile(METLO_CONFIG_SCHEMA)
  const valid = validate(metloConfig)
  if (!valid) {
    const errors = validate.errors
    if (errors) {
      const error = errors[0]
      let instancePath = error.instancePath
        .replace(/\//g, ".")
        .replace(/~1/g, "/")
        .slice(1)
      let errorMessage = `${error.instancePath} ${error.message}`
      switch (error.keyword) {
        case "additionalProperties":
          const additionalProperty = error.params.additionalProperty
          instancePath += `.${additionalProperty}`
          errorMessage = `property '${additionalProperty}' is not expected to be here`
          break
        case "enum":
          errorMessage = `must be equal to one of the allowed values: ${error.params.allowedValues?.join(
            ", ",
          )}`
          break
      }
      const lineNumber = map.lookup(instancePath)?.line
      throw new Error400BadRequest(
        `${errorMessage}${lineNumber ? ` on line ${lineNumber}` : ""}`,
      )
    }
  }
  return metloConfig
}
