import { getMetloConfig } from "services/metlo-config"
import { MetloContext } from "types"
import jsyaml from "js-yaml"
import { RiskScore, __DataClass_INTERNAL__ } from "@common/enums"
import { DataClass, MetloConfigResp } from "@common/types"
import { __DATA_CLASS_TO_RISK_SCORE_INTERNAL__ } from "@common/maps"
import { __DATA_CLASS_REGEX_MAP_INTERNAL__ } from "services/scanner/scan"
import { RedisClient } from "../../utils/redis"
import { customDataClass, rawDataClass } from "./utils"
import { DataField } from "models"
import { getEntityManager } from "services/database/utils"
import { ArrayOverlap } from "typeorm"
import { AppDataSource } from "data-source"

const DATA_CLASS_KEY = `METLO_DATA_CLASS`

const DEFAULT_CLASSES = Object.values(__DataClass_INTERNAL__)

async function getOrSet(
  ctx: MetloContext,
  key: string,
  fn: () => Promise<DataClass[]>,
) {
  const fetchValue = (await RedisClient.getFromRedis(ctx, key)) as
    | DataClass[]
    | null
  if (fetchValue && fetchValue.length > 0) {
    return fetchValue
  } else {
    const fnValue = await fn()
    await RedisClient.addToRedis(ctx, key, fnValue)
    return fnValue
  }
}

function getValidMetloDataClasses(ctx: MetloContext, jsConfig: object) {
  if (
    "disabledDataClass" in jsConfig &&
    jsConfig["disabledDataClass"].hasOwnProperty("length") &&
    (jsConfig["disabledDataClass"] as unknown[]).length > 0
  ) {
    const disabledClasses = jsConfig["disabledDataClass"] as string[]
    const filteredClasses = Object.keys(__DataClass_INTERNAL__)
      .filter(clsName => !disabledClasses.includes(clsName))
      .map(clsName => __DataClass_INTERNAL__[clsName])
    return filteredClasses
  } else {
    return DEFAULT_CLASSES
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
    const jsConfig = (jsyaml.load(metloConfig.configString) as object) || {}
    let metloDefinedClassMap = [] as rawDataClass[]
    let userDefinedClassMap = [] as rawDataClass[]
    if ("sensitiveData" in jsConfig) {
      const roughMap = Object.entries(jsConfig["sensitiveData"])
        .map(([configName, config]) => {
          const parsedData = customDataClass.safeParse(config)
          if (parsedData.success) {
            return { [`${configName.toUpperCase()}`]: parsedData.data }
          } else {
            // TODO ?
            return undefined
          }
        })
        .filter(v => v !== undefined)
      roughMap.forEach(v => {
        const [key, { severity, patterns: regexList, ...rest1 }, ...rest] =
          Object.entries(v)[0]
        userDefinedClassMap.push({
          className: key,
          severity: RiskScore[severity] as RiskScore,
          regex: new RegExp(regexList.map(regex => `(${regex})`).join("|")),
        })
      })
    }

    getValidMetloDataClasses(ctx, jsConfig).forEach(enumKey => {
      const reg = __DATA_CLASS_REGEX_MAP_INTERNAL__[enumKey]
      metloDefinedClassMap.push({
        className: enumKey,
        severity: __DATA_CLASS_TO_RISK_SCORE_INTERNAL__[enumKey],
        regex: reg,
      })
    })
    return [...metloDefinedClassMap, ...userDefinedClassMap].map(cls => {
      if (cls.regex) {
        return { ...cls, regex: cls.regex.source }
      } else {
        return { className: cls.className, severity: cls.severity }
      }
    }) as DataClass[]
  }
  return getOrSet(ctx, DATA_CLASS_KEY, () => innerFunction())
}

export async function clearDataClassCache(ctx: MetloContext) {
  RedisClient.deleteFromRedis(ctx, [DATA_CLASS_KEY])
}

export async function cleanupStoredDataClasses(
  ctx: MetloContext,
  currentConfigResp: MetloConfigResp,
  newConfigResp: string,
) {
  let currentConfig = currentConfigResp
  if (!currentConfig) {
    currentConfig = {
      uuid: "",
      configString: "",
    }
  }
  const jsConfigCurrent =
    (jsyaml.load(currentConfig.configString) as object) || {}
  const jsConfigNew = (jsyaml.load(newConfigResp) as object) || {}

  const dataClassesDiff = new Set<string>()
  if ("sensitiveData" in jsConfigCurrent) {
    Object.keys(jsConfigCurrent["sensitiveData"]).forEach(configName => {
      dataClassesDiff.add(configName.toUpperCase())
    })
  }
  if ("sensitiveData" in jsConfigNew) {
    Object.keys(jsConfigNew["sensitiveData"]).forEach(configName => {
      dataClassesDiff.delete(configName.toUpperCase())
    })
  }

  if (
    "disabledDataClass" in jsConfigNew &&
    jsConfigNew["disabledDataClass"].hasOwnProperty("length") &&
    (jsConfigNew["disabledDataClass"] as unknown[]).length > 0
  ) {
    const disabledClasses = jsConfigNew["disabledDataClass"] as string[]
    disabledClasses.forEach(cls =>
      dataClassesDiff.add(__DataClass_INTERNAL__[cls]),
    )
  }

  const dataClassesDiffReadonly: readonly string[] = Array.from(dataClassesDiff)

  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  let error = false
  try {
    await queryRunner.startTransaction()
    const DFs = await getEntityManager(ctx, queryRunner).find(DataField, {
      select: {
        uuid: true,
        dataClasses: true,
        falsePositives: true,
        scannerIdentified: true,
      },
      where: {
        dataClasses: ArrayOverlap(dataClassesDiffReadonly),
      },
    })

    const newDFs = DFs.map(DF => {
      DF.dataClasses = DF.dataClasses.filter(dc => !dataClassesDiff.has(dc))
      DF.falsePositives = DF.falsePositives.filter(
        dc => !dataClassesDiff.has(dc),
      )
      DF.scannerIdentified = DF.scannerIdentified.filter(
        dc => !dataClassesDiff.has(dc),
      )
      return DF
    })

    await getEntityManager(ctx, queryRunner).saveList(newDFs)
    await queryRunner.commitTransaction()
  } catch (err) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    error = true
  } finally {
    await queryRunner.release()
  }
  if (error) {
    throw new Error("Couldn't modify existing data classes ")
  }
}

export async function ensureValidCustomDataClasses(
  ctx: MetloContext,
  newConfigResp: string,
) {
  const newConfig = (jsyaml.load(newConfigResp) as object) || {}
  if ("sensitiveData" in newConfig) {
    const existingClasses = DEFAULT_CLASSES as string[]
    for (const configName of Object.keys(newConfig["sensitiveData"])) {
      if (existingClasses.includes(configName)) {
        return {
          success: false,
          msg: `Dataclass "${configName}" already exists as a Metlo Defined Dataclass`,
          err: new Error(
            `Custom class name matches existing class name ${configName}`,
          ),
        }
      }
    }
  }
  return { success: true, msg: "", err: {} }
}
