import { Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { createNewWebhook, deleteWebhook, getWebhooks } from "services/webhook"
import { MetloRequest } from "types"
import { CreateWebhookParams } from "@common/types"

export const getWebhooksHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const webhooks = await getWebhooks(req.ctx)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const createWebhookHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const createWebhookParams: CreateWebhookParams = req.body
    const webhooks = await createNewWebhook(req.ctx, createWebhookParams)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteWebhookHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { webhookId } = req.params
    const webhooks = await deleteWebhook(req.ctx, webhookId)
    await ApiResponseHandler.success(res, webhooks)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
