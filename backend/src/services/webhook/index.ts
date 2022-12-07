import { QueryRunner } from "typeorm"
import axios from "axios"
import { Alert, Webhook } from "models"
import { getQB } from "services/database/utils"
import { MetloContext } from "types"

const delay = (fn: any, ms: number) =>
  new Promise(resolve => setTimeout(() => resolve(fn()), ms))

const retryRequest = async (fn: any, maxRetries: number) => {
  const executeRequest = async (attempt: number) => {
    try {
      return await fn()
    } catch (err) {
      if (err?.response?.status > 400 && attempt <= maxRetries) {
        return delay(() => executeRequest(attempt + 1), 1000)
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
  queryRunner: QueryRunner,
) => {
  try {
    for (const alert of alerts) {
      console.log("alert", alert)
      const webhooks: Webhook[] = await getQB(ctx, queryRunner)
        .from(Webhook, "webhook")
        .andWhere(`:type = ANY("alertTypes")`, { type: alert.type })
        .getRawMany()
      console.log(webhooks)
      for (const webhook of webhooks) {
        try {
          await retryRequest(
            () => axios.post(webhook.url, alert),
            webhook.maxRetries,
          )
        } catch (err) {
          if (webhook.errors.length < 10 && err) {
            await getQB(ctx, queryRunner)
              .update(Webhook)
              .set({ errors: [...webhook.errors, err] })
              .andWhere("uuid = :id", { id: webhook.uuid })
              .execute()
          }
        }
      }
    }
  } catch {}
}
