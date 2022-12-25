import { getMetloConfig } from "services/metlo-config";
import { MetloContext } from "types";
import jsyaml from "js-yaml"
import Zod from "zod"
import { RiskScore, __DataClass_INTERNAL__ } from "@common/enums";
import { DataClass } from "@common/types";
import { __DATA_CLASS_TO_RISK_SCORE_INTERNAL__ } from "@common/maps";
import { __DATA_CLASS_REGEX_MAP_INTERNAL__ } from "services/scanner/scan";
import { RedisClient } from "./redis";

interface rawDataClass {
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

const customDataClass = Zod.object({
    severity: Zod.enum(SCORE_VALUES),
    patterns: Zod.string().array()
})

const DATA_CLASS_KEY = `METLO_DATA_CLASS`


async function getOrSet(ctx: MetloContext, key: string, fn: () => Promise<DataClass[]>) {
    const fetchValue = (await RedisClient.getFromRedis(ctx, key)) as DataClass[] | null
    if (fetchValue && fetchValue.length > 0) {
        return fetchValue
    } else {
        const fnValue = await fn()
        await RedisClient.addToRedis(ctx, key, fnValue)
        return fnValue
    }
}

export async function getCombinedDataClasses(ctx: MetloContext) {
    const innerFunction = async () => {
        let metloConfig = await getMetloConfig(ctx)
        if (!metloConfig) {
            metloConfig = {
                uuid: "",
                configString: "",
            }
        }
        const jsConfig = (jsyaml.load(metloConfig.configString) as object || {})
        let metloDefinedClassMap = [] as rawDataClass[]
        let userDefinedClassMap = [] as rawDataClass[]
        if ("sensitiveData" in jsConfig) {
            const roughMap = Object.entries(jsConfig["sensitiveData"]).map(([configName, config]) => {
                const parsedData = customDataClass.safeParse(config)
                if (parsedData.success) {
                    return { [`${configName}`]: parsedData.data }
                } else {
                    // TODO ?
                    return undefined
                }
            }).filter(v => v !== undefined)
            roughMap.forEach((v) => {
                const [key, { severity, patterns: regexList, ...rest1 }, ...rest] = Object.entries(v)[0]
                userDefinedClassMap.push({
                    className: key,
                    severity: RiskScore[severity] as RiskScore,
                    regex: new RegExp(regexList.map((regex) => `(${regex})`).join("|"))
                })
            })
        }

        Object.entries(__DataClass_INTERNAL__).forEach(([enumValue, enumKey]) => {
            const reg = __DATA_CLASS_REGEX_MAP_INTERNAL__[(enumKey as any)]
            metloDefinedClassMap.push({
                className: enumKey,
                severity: __DATA_CLASS_TO_RISK_SCORE_INTERNAL__[enumKey],
                regex: reg
            })
        })
        return [...metloDefinedClassMap, ...userDefinedClassMap].map(
            cls => {
                if (cls.regex) {
                    return { ...cls, regex: cls.regex.source }
                } else {
                    return { className: cls.className, severity: cls.severity }
                }
            }
        ) as DataClass[]
    }
    return getOrSet(ctx, DATA_CLASS_KEY, () => innerFunction())
}

export async function clearDataClassCache(ctx: MetloContext) {
    RedisClient.deleteFromRedis(ctx, [DATA_CLASS_KEY])
}

