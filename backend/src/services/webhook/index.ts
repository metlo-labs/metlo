import axios from "axios"
import { Alert, Webhook } from "models"
import { getQB } from "services/database/utils"
import { MetloContext } from "types"
import { AppDataSource } from "data-source"

const delay = (fn: any, ms: number) =>
  new Promise(resolve => setTimeout(() => resolve(fn()), ms))

const retryRequest = async (fn: any, maxRetries: number) => {
  const executeRequest = async (attempt: number) => {
    try {
      return await fn()
    } catch (err) {
      if (err?.response?.status > 400 && attempt <= maxRetries) {
        return delay(() => executeRequest(attempt + 1), 500)
      } else {
        const errResp = err.response
        const { request, ...errorObject } = errResp
        throw errorObject?.data ?? err
      }
    }
  }
  return executeRequest(1)
}

export const sendWebhookRequests = async (
  ctx: MetloContext,
  alerts: Alert[],
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    for (const alert of alerts) {
      const webhooks: Webhook[] = await getQB(ctx, queryRunner)
        .from(Webhook, "webhook")
        .andWhere(`:type = ANY("alertTypes")`, { type: alert.type })
        .getRawMany()
      for (const webhook of webhooks) {
        let runs = webhook.runs
        if (runs.length >= 10) {
          runs = runs.slice(1)
        }
        try {
          await retryRequest(
            () => axios.post(webhook.url, alert),
            webhook.maxRetries,
          )
          await getQB(ctx, queryRunner)
            .update(Webhook)
            .set({ runs: [...runs, { ok: true, msg: "" }] })
            .andWhere("uuid = :id", { id: webhook.uuid })
            .execute()
        } catch (err) {
          await getQB(ctx, queryRunner)
            .update(Webhook)
            .set({ runs: [...runs, { ok: false, msg: err }] })
            .andWhere("uuid = :id", { id: webhook.uuid })
            .execute()
        }
      }
    }
  } catch {
  } finally {
    await queryRunner.release()
  }
}
