import { AppDataSource } from "data-source"
import jsyaml from "js-yaml"
import { MetloConfig } from "models/metlo-config"
import { getEntityManager } from "services/database/utils"
import { MigrationInterface, QueryRunner } from "typeorm"
import { decrypt, encrypt, generate_iv } from "utils/encryption"

export class metloConfigEnv1673503553138 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "env" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "envTag" text`,
    )
    await queryRunner.query(
      `ALTER TABLE "metlo_config" ADD COLUMN IF NOT EXISTS "envIV" text`,
    )

    const entityManager = AppDataSource.createEntityManager(queryRunner)

    const configs = await entityManager.find(MetloConfig, {
      select: { configString: true, uuid: true },
    })

    configs.forEach(async config => {
      const parsedConfigString = jsyaml.load(config.configString) as Object
      if ("globalTestEnv" in parsedConfigString) {
        const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
        const iv = generate_iv()
        const { encrypted, tag } = encrypt(
          JSON.stringify(parsedConfigString.globalTestEnv),
          key,
          iv,
        )
        delete parsedConfigString.globalTestEnv
        config.configString = jsyaml.dump(parsedConfigString)
        config.env = encrypted
        config.envTag = tag.toString("base64")
        config.envIV = iv.toString("base64")
        await entityManager.save(MetloConfig, config)
      }
    })
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = AppDataSource.createEntityManager(queryRunner)
    const configs = await entityManager.find(MetloConfig, {
      select: {
        configString: true,
        uuid: true,
        // env,envIV,envTag are defaulted to not being selected.
        // So explicit select is required
        env: true,
        envIV: true,
        envTag: true,
      },
    })

    configs.forEach(async config => {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
      const iv = Buffer.from(config.envIV, "base64")
      const tag = Buffer.from(config.envTag, "base64")
      const decryptedEnv = decrypt(config.env, key, iv, tag)
      config.configString = jsyaml.dump({
        ...(jsyaml.load(config.configString) as object),
        globalTestEnv: JSON.parse(decryptedEnv),
      })
      await entityManager.save(MetloConfig, config)
    })

    await queryRunner.dropColumn("metlo_config", "env")
    await queryRunner.dropColumn("metlo_config", "envIV")
    await queryRunner.dropColumn("metlo_config", "envTag")
  }
}
