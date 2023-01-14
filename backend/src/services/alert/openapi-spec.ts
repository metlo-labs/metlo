import { QueryRunner } from "typeorm"
import jsonMap from "json-source-map"
import SourceMap from "js-yaml-source-map"
import yaml from "js-yaml"
import { QueuedApiTrace } from "@common/types"
import { Alert, OpenApiSpec } from "models"
import { MetloContext } from "types"
import { existingUnresolvedAlert } from "./utils"
import { AlertType, SpecExtension } from "@common/enums"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import { getQB } from "services/database/utils"
import mlog from "logger"

export const createSpecDiffAlerts = async (
  ctx: MetloContext,
  alertItems: Record<string, string[]>,
  apiEndpointUuid: string,
  apiTrace: QueuedApiTrace,
  openApiSpec: OpenApiSpec,
  queryRunner: QueryRunner,
): Promise<Alert[]> => {
  try {
    if (!alertItems) {
      return []
    }
    if (Object.keys(alertItems)?.length === 0) {
      return []
    }
    let alerts: Alert[] = []
    for (const key in alertItems) {
      const existing = await existingUnresolvedAlert(
        ctx,
        apiEndpointUuid,
        AlertType.OPEN_API_SPEC_DIFF,
        key,
      )
      if (!existing) {
        const newAlert = new Alert()
        newAlert.type = AlertType.OPEN_API_SPEC_DIFF
        newAlert.riskScore =
          ALERT_TYPE_TO_RISK_SCORE[AlertType.OPEN_API_SPEC_DIFF]
        newAlert.apiEndpointUuid = apiEndpointUuid
        const pathPointer = alertItems[key]
        const minimizedSpecKey = pathPointer.join(".")
        newAlert.context = {
          pathPointer,
          trace: apiTrace,
        }
        newAlert.createdAt = apiTrace.createdAt
        newAlert.updatedAt = apiTrace.createdAt
        if (!openApiSpec.minimizedSpecContext[minimizedSpecKey]) {
          let lineNumber = null
          if (openApiSpec.extension === SpecExtension.JSON) {
            const result = jsonMap.parse(openApiSpec.spec)
            let pathKey = ""
            for (let i = 0; i < pathPointer?.length; i++) {
              let pathToken = pathPointer[i]
              pathToken = pathToken.replace(/\//g, "~1")
              pathKey += `/${pathToken}`
            }
            lineNumber = result.pointers?.[pathKey]?.key?.line
            if (lineNumber) {
              lineNumber += 1
            }
          } else if (openApiSpec.extension === SpecExtension.YAML) {
            const map = new SourceMap()
            yaml.load(openApiSpec.spec, { listener: map.listen() })
            lineNumber = map.lookup(pathPointer)?.line
            if (lineNumber) {
              lineNumber -= 1
            }
          }
          if (lineNumber) {
            const minimizedString = openApiSpec.spec
              .split(/\r?\n/)
              .slice(lineNumber - 5, lineNumber + 5)
              .join("\n")
            openApiSpec.minimizedSpecContext[minimizedSpecKey] = {
              lineNumber,
              minimizedSpec: minimizedString,
            }
          }
        }
        newAlert.description = key
        alerts.push(newAlert)
        await getQB(ctx, queryRunner)
          .update(OpenApiSpec)
          .set({ minimizedSpecContext: openApiSpec.minimizedSpecContext })
          .andWhere("name = :name", { name: openApiSpec.name })
          .execute()
      }
    }
    return alerts
  } catch (err) {
    mlog.withErr(err).error("Error creating spec diff alerts")
    return []
  }
}
