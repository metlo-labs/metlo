import { In } from "typeorm"
import { AttackResponse, GetAttackParams } from "@common/types"
import { AppDataSource } from "data-source"
import Error500InternalServer from "errors/error-500-internal-server"
import { Attack } from "models/attack"
import { FindOptionsWhere } from "typeorm"
import { hasValidLicense } from "utils/license"

export const getAttacks = async (
  getAttackParams: GetAttackParams,
): Promise<AttackResponse> => {
  try {
    const validLicense = await hasValidLicense()
    if (!validLicense) {
      return {
        attacks: [],
        totalAttacks: 0,
        validLicense: false,
      }
    }

    const attackRepository = AppDataSource.getRepository(Attack)
    let whereConditions: FindOptionsWhere<Attack> = {}

    if (getAttackParams?.riskScores) {
      whereConditions = {
        ...whereConditions,
        riskScore: In(getAttackParams.riskScores),
      }
    }

    const resp = await attackRepository.findAndCount({
      where: whereConditions,
      relations: {
        apiEndpoint: true,
      },
      order: {
        riskScore: "DESC",
      },
      skip: getAttackParams?.offset ?? 0,
      take: getAttackParams?.limit ?? 10,
    })

    return {
      attacks: resp[0],
      totalAttacks: resp[1],
      validLicense: true,
    }
  } catch (err) {
    console.error(`Error Getting Attacks: ${err}`)
    throw new Error500InternalServer(err)
  }
}
