import { RiskScore } from "@common/enums"
import Zod from "zod"

export interface rawDataClass {
    className: string,
    severity: RiskScore,
    regex: RegExp
}

const scoreArray = Object.keys(RiskScore)

// Score array has to be of the format [string, ...string[]] so as to indicate a non-empty array
const SCORE_VALUES: [string, ...string[]] = [
    scoreArray[0],
    ...scoreArray.slice(1).map((p) => p)
]

export const customDataClass = Zod.object({
    severity: Zod.enum(SCORE_VALUES),
    patterns: Zod.string().array()
})