import { GenerateTestParams, GenerateTestRes } from "@common/types"
import { MetloContext } from "types"
import { TEMPLATES } from "@metlo/testing/dist/templates"
import { getGenTestEndpoint } from "./utils"
import groupBy from "lodash/groupBy"

const TYPE_TO_TEMPLATES = groupBy(TEMPLATES, e => e.name)

export const generateTest = async (
  ctx: MetloContext,
  { type, host, endpoint, version }: GenerateTestParams,
): Promise<GenerateTestRes> => {
  const genTestEndpoint = await getGenTestEndpoint(ctx, endpoint, host)
  if (!genTestEndpoint) {
    return {
      success: false,
      msg: `Couldn't find endpoint - Endpoint: ${endpoint} Host: ${host}`,
    }
  }
  try {
    const templates = TYPE_TO_TEMPLATES[type.toUpperCase()]
    if (!templates) {
      return {
        success: false,
        msg: `INVALID TEMPLATE TYPE: ${type}`,
      }
    }
    const sortedTemplates = templates.sort((a, b) => b.version - a.version)
    let template = sortedTemplates[0]
    if (version) {
      template = sortedTemplates.find(e => e.version == version)
    }
    if (!template) {
      return {
        success: false,
        msg: `INVALID VERSION FOR TEMPLATE "${type}": ${version}`,
      }
    }
    return {
      success: true,
      templateName: template.name,
      templateVersion: template.version,
      test: template.builder(genTestEndpoint).getTest(),
    }
  } catch (err) {
    return {
      success: false,
      msg: err.message,
    }
  }
}
