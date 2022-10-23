import { RiskScore, SpecExtension } from "@common/enums"

export const pathParameterRegex: RegExp = new RegExp(String.raw`/{[^/]+}`, "g")

export const RISK_SCORE_ORDER: Record<RiskScore, number> = {
  [RiskScore.HIGH]: 3,
  [RiskScore.MEDIUM]: 2,
  [RiskScore.LOW]: 1,
  [RiskScore.NONE]: 0,
}

export const RISK_SCORE_ORDER_QUERY = (
  table: string,
  column: string,
): string => `
CASE "${table}"."${column}"
  WHEN '${RiskScore.HIGH}' THEN ${RISK_SCORE_ORDER[RiskScore.HIGH]}
  WHEN '${RiskScore.MEDIUM}' THEN ${RISK_SCORE_ORDER[RiskScore.MEDIUM]}
  WHEN '${RiskScore.LOW}' THEN ${RISK_SCORE_ORDER[RiskScore.LOW]}
  WHEN '${RiskScore.NONE}' THEN ${RISK_SCORE_ORDER[RiskScore.NONE]}
END
`

export const EXTENSION_TO_MIME_TYPE: Record<SpecExtension, string[]> = {
  [SpecExtension.JSON]: ["application/json"],
  [SpecExtension.YAML]: [
    "text/yaml",
    "text/x-yaml",
    "application/x-yaml",
    "application/yaml",
  ],
}

export const AUTH_CONFIG_LIST_KEY = "auth_config_list"

export const BLOCK_FIELDS_ALL_REGEX = "^.*$"
