import { RiskScore } from "@common/enums"
import Zod from "zod"

interface rawDataClassRegex {
  className: string
  severity: RiskScore
  regex?: RegExp
  shortName?: string
}
interface rawDataClassKeyRegex {
  className: string
  severity: RiskScore
  keyRegex?: RegExp
  shortName?: string
}

export interface rawDataClass extends rawDataClassRegex, rawDataClassKeyRegex {}

const scoreArray = Object.keys(RiskScore)

// Score array has to be of the format [string, ...string[]] so as to indicate a non-empty array
const SCORE_VALUES: [string, ...string[]] = [
  scoreArray[0],
  ...scoreArray.slice(1).map(p => p),
]

export const customDataClass = Zod.object({
  severity: Zod.enum(SCORE_VALUES),
  patterns: Zod.string().array().optional(),
  keyPatterns: Zod.string().array().optional(),
})
  .partial()
  .refine(
    data => data.severity && (data.patterns || data.keyPatterns),
    "Severity must be provided along with either of patterns or keyPatterns",
  )
