import yargs from "yargs"
import { randomBytes } from "crypto"
import { AppDataSource } from "data-source"
import { ApiEndpoint, Attack } from "models"
import { AttackType } from "@common/enums"
import { ATTACK_TYPE_TO_RISK_SCORE } from "@common/maps"
import { DateTime } from "luxon"

const randomDate = (start?: boolean) => {
  const startTime = start
    ? DateTime.now().minus({ hours: 5 }).toJSDate().getTime()
    : DateTime.now().minus({ minutes: 50 }).toJSDate().getTime()
  const endTime = start
    ? DateTime.now().minus({ hours: 1 }).toJSDate().getTime()
    : DateTime.now().toJSDate().getTime()
  return new Date(startTime + Math.random() * (endTime - startTime))
}

const generateAttacks = async (numAttacks: number) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  try {
    const endpoints = await queryRunner.manager.find(ApiEndpoint, {
      select: { uuid: true, host: true },
    })
    const attackTypes = Object.keys(AttackType)
    const insertAttacks: Attack[] = []
    for (let i = 0; i < numAttacks; i++) {
      const newAttack = new Attack()
      const randTypeNum = Math.floor(Math.random() * attackTypes.length)
      const randEndpointNum = Math.floor(Math.random() * endpoints.length)
      newAttack.attackType = AttackType[attackTypes[randTypeNum]]
      newAttack.riskScore = ATTACK_TYPE_TO_RISK_SCORE[newAttack.attackType]
      newAttack.description = `${newAttack.attackType} detected.`
      newAttack.startTime = randomDate(true)
      newAttack.endTime = randomDate()
      newAttack.uniqueSessionKey = randomBytes(16).toString("hex")
      newAttack.apiEndpointUuid = endpoints[randEndpointNum].uuid
      newAttack.host = endpoints[randEndpointNum].host
      insertAttacks.push(newAttack)
    }
    await queryRunner.manager.insert(Attack, insertAttacks)
  } catch (err) {
    console.error(`Encountered error while generating sample attacks: ${err}`)
  } finally {
    await queryRunner.release()
  }
}

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")
  const args = yargs.argv
  const numAttacks = args["numAttacks"] ?? 20
  await generateAttacks(numAttacks)
}

main()
