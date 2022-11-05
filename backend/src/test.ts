import { RiskScore } from "@common/enums"
import { AppDataSource } from "data-source"
import { ApiEndpoint } from "models"
import { getRepoQB } from "services/database/utils"

AppDataSource.initialize().then(async () => {
  const resp = await getRepoQB({}, ApiEndpoint)
    .where("uuid = :uuid", { uuid: "5913e75f-b2fb-45c0-bad8-af87ef4fbf2c" })
    .select()
    .getOne()
  console.log(resp)
  const resp2 = await getRepoQB({}, ApiEndpoint)
    .andWhere("uuid = :uuid", { uuid: "5913e75f-b2fb-45c0-bad8-af87ef4fbf2d" })
    .update()
    .set({
      riskScore: RiskScore.MEDIUM,
    })
    .execute()
  console.log(resp2)
})
