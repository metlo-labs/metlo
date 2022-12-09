import axios from "axios"
import { Brackets } from "typeorm"
import { Alert, ApiEndpoint, DataField, Webhook } from "models"
import { createQB, getQB, insertValueBuilder } from "services/database/utils"
import { MetloContext } from "types"
import { AppDataSource } from "data-source"
import { CreateWebhookParams } from "@common/types"
import Error400BadRequest from "errors/error-400-bad-request"
import Error500InternalServer from "errors/error-500-internal-server"
import { getDataFieldsQuery } from "analyze-traces"

const urlRegexp = new RegExp(
  /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/,
)

const validUrl = (url: string) => urlRegexp.test(url)

const delay = (fn: any, ms: number) =>
  new Promise(resolve => setTimeout(() => resolve(fn()), ms))

const retryRequest = async (fn: any, maxRetries: number) => {
  const executeRequest = async (attempt: number) => {
    try {
      return await fn()
    } catch (err) {
      if (err?.response?.status >= 500 && attempt <= maxRetries) {
        return delay(() => executeRequest(attempt + 1), 500)
      } else {
        throw err?.response?.data ?? err?.message
      }
    }
  }
  return executeRequest(1)
}

export const sendWebhookRequests = async (
  ctx: MetloContext,
  alerts: Alert[],
  apiEndpoint: ApiEndpoint,
) => {
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    let dataFields: DataField[] = []
    if (alerts?.length > 0) {
      dataFields = await queryRunner.query(getDataFieldsQuery(ctx), [
        apiEndpoint.uuid,
      ])
    }
    for (const alert of alerts) {
      const webhooks: Webhook[] = await getQB(ctx, queryRunner)
        .from(Webhook, "webhook")
        .andWhere(
          new Brackets(qb => {
            qb.where(`:type = ANY("alertTypes")`, { type: alert.type }).orWhere(
              `cardinality("alertTypes") = 0`,
            )
          }),
        )
        .getRawMany()
      alert.apiEndpoint = apiEndpoint
      alert.apiEndpoint.dataFields = dataFields
      for (const webhook of webhooks) {
        let runs = webhook.runs
        if (runs.length >= 10) {
          runs = runs.slice(1)
        }
        try {
          await retryRequest(
            () => axios.post(webhook.url, alert, { timeout: 250 }),
            webhook.maxRetries,
          )
          await getQB(ctx, queryRunner)
            .update(Webhook)
            .set({ runs: [...runs, { ok: true, msg: "", payload: alert }] })
            .andWhere("uuid = :id", { id: webhook.uuid })
            .execute()
        } catch (err) {
          await getQB(ctx, queryRunner)
            .update(Webhook)
            .set({ runs: [...runs, { ok: false, msg: err, payload: alert }] })
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

export const getWebhooks = async (ctx: MetloContext) => {
  return await createQB(ctx)
    .from(Webhook, "webhook")
    .orderBy(`"createdAt"`, "DESC")
    .getRawMany()
}

export const createNewWebhook = async (
  ctx: MetloContext,
  createWebhookParams: CreateWebhookParams,
) => {
  if (!createWebhookParams.url) {
    throw new Error400BadRequest("Must provide url for webhook.")
  }
  if (!validUrl(createWebhookParams.url)) {
    throw new Error400BadRequest("Please enter a valid url.")
  }
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    const webhook = new Webhook()
    webhook.url = createWebhookParams.url.trim()
    if (createWebhookParams.alertTypes?.length > 0) {
      webhook.alertTypes = createWebhookParams.alertTypes
    }
    await insertValueBuilder(ctx, queryRunner, Webhook, webhook).execute()
    return await getQB(ctx, queryRunner)
      .from(Webhook, "webhook")
      .orderBy(`"createdAt"`, "DESC")
      .getRawMany()
  } catch {
    throw new Error500InternalServer(
      "Encountered error while creating new webhook.",
    )
  } finally {
    await queryRunner.release()
  }
}

export const deleteWebhook = async (ctx: MetloContext, webhookId: string) => {
  if (!webhookId) {
    throw new Error400BadRequest("Must provide id of webhook to delete.")
  }
  const queryRunner = AppDataSource.createQueryRunner()
  try {
    await queryRunner.connect()
    await getQB(ctx, queryRunner)
      .delete()
      .from(Webhook, "webhook")
      .andWhere("uuid = :id", { id: webhookId })
      .execute()
    return await getQB(ctx, queryRunner)
      .from(Webhook, "webhook")
      .orderBy(`"createdAt"`, "DESC")
      .getRawMany()
  } catch {
    throw new Error500InternalServer(
      "Encountered error while deleting webhook.",
    )
  } finally {
    await queryRunner.release()
  }
}
