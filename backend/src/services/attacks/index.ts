import { In, FindOptionsWhere } from "typeorm"
import { AttackResponse, GetAttackParams } from "@common/types"
import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { Attack } from "models/attack"
import { hasValidLicense } from "utils/license"
import { AttackType } from "@common/enums"

export const getAttacks = async (
  getAttackParams: GetAttackParams,
): Promise<AttackResponse> => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const validLicense = await hasValidLicense()
    if (!validLicense) {
      return {
        attackTypeCount: {} as Record<AttackType, number>,
        attacks: [],
        totalAttacks: 0,
        totalEndpoints: 0,
        validLicense: false,
      }
    }

    const totalEndpointsQb = queryRunner.manager
      .createQueryBuilder()
      .select([
        'CAST(COUNT(DISTINCT("apiEndpointUuid")) AS INTEGER) as "totalEndpoints"',
      ])
      .from(Attack, "attacks")
    const attackTypeCountQb = queryRunner.manager
      .createQueryBuilder()
      .select(['"attackType"', "CAST(COUNT(*) AS INTEGER) as count"])
      .from(Attack, "attacks")

    let whereConditions: FindOptionsWhere<Attack> = {}

    if (getAttackParams?.riskScores) {
      whereConditions = {
        ...whereConditions,
        riskScore: In(getAttackParams.riskScores),
      }
      totalEndpointsQb.where('"riskScore" IN(:...scores)', {
        scores: getAttackParams.riskScores,
      })
      attackTypeCountQb.where('"riskScore" IN(:...scores)', {
        scores: getAttackParams.riskScores,
      })
    }
    if (getAttackParams?.hosts) {
      whereConditions = {
        ...whereConditions,
        host: In(getAttackParams.hosts),
      }
      totalEndpointsQb.andWhere("host IN(:...hosts)", {
        hosts: getAttackParams.hosts,
      })
      attackTypeCountQb.andWhere("host IN(:...hosts)", {
        hosts: getAttackParams.hosts,
      })
    }

    const totalEndpointsRes = await totalEndpointsQb.getRawOne()
    const attackTypeCountRes = await attackTypeCountQb
      .groupBy('"attackType"')
      .orderBy('"attackType"')
      .getRawMany()
    const resp = await queryRunner.manager.findAndCount(Attack, {
      where: whereConditions,
      relations: {
        apiEndpoint: true,
      },
      order: {
        riskScore: "DESC",
        resolved: "DESC",
        startTime: "DESC",
      },
      skip: getAttackParams?.offset ?? 0,
      take: getAttackParams?.limit ?? 10,
    })

    return {
      attacks: resp[0],
      totalAttacks: resp[1],
      totalEndpoints: totalEndpointsRes?.totalEndpoints,
      attackTypeCount: Object.fromEntries(
        attackTypeCountRes.map(e => [e.attackType, e.count]),
      ) as any,
      validLicense: true,
    }
  } catch (err) {
    console.error(`Error Getting Attacks: ${err}`)
    throw new Error500InternalServer(err)
  } finally {
    await queryRunner.release()
  }
}
