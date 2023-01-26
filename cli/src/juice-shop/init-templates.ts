import ora from "ora"
import chalk from "chalk"
import axios from "axios"
import { urlJoin } from "../testing/utils"
import { getConfig } from "../utils"
import { PushTemplateReq, PushTemplateResp } from "../testing/push-template"
import {
  JUICE_SHOP_BOLA,
  JUICE_SHOP_BROKEN_AUTHENTICATION,
  JUICE_SHOP_SQL_INJECTION,
  JUICE_SHOP_SQL_INJECTION_TIME_BASED,
} from "./constants"

const spinner = ora()

export const initJuiceShopTemplates = async () => {
  const templateRequests: PushTemplateReq[] = [
    {
      template: JUICE_SHOP_BOLA,
      type: "TS",
    },
    {
      template: JUICE_SHOP_BROKEN_AUTHENTICATION,
      type: "TS",
    },
    {
      template: JUICE_SHOP_SQL_INJECTION,
      type: "TS",
    },
    {
      template: JUICE_SHOP_SQL_INJECTION_TIME_BASED,
      type: "TS",
    },
  ]
  if (templateRequests == null) {
    return
  }
  if (templateRequests.length == 0) {
    return
  }

  spinner.start(chalk.dim(`Pushing ${templateRequests.length} templates...`))
  const config = getConfig()
  let url = urlJoin(config.metloHost, "api/v1/template")

  try {
    const { data: resp } = await axios.post<PushTemplateResp[]>(
      url,
      { templates: templateRequests },
      {
        headers: { Authorization: config.apiKey },
      },
    )
    spinner.succeed(chalk.green("Done pushing templates."))
    const savedTemplates = resp.filter(e => !e.exists)
    const skippedTemplates = resp.filter(e => e.exists)
    if (savedTemplates.length > 0) {
      console.log(chalk.bold.green(`Saved ${savedTemplates.length} Templates.`))
      savedTemplates.forEach(e => {
        console.log(chalk.bold.green(`  • ${e.name} - Version ${e.version}`))
      })
    }
    if (skippedTemplates.length > 0) {
      console.log(
        chalk.bold.dim(
          `Skipped ${skippedTemplates.length} Already Existing Templates.`,
        ),
      )
      skippedTemplates.forEach(e => {
        console.log(chalk.bold.dim(`  • ${e.name} - Version ${e.version}`))
      })
    }
  } catch (err) {
    spinner.fail(chalk.bold.red("Failed pushing templates"))
    console.log(chalk.bold.red(err.message))
    if (err?.response?.data) {
      console.log(chalk.red(JSON.stringify(err?.response?.data, null, 4)))
    }
  }
}
